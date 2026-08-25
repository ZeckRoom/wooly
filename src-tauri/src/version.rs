use crate::download::DownloadFile;
use crate::error::{Result, WoolyError};
use crate::http;
use crate::logic::{natives_arch_token, os_arch, os_name};
use crate::model::CatalogVersion;
use crate::paths::{
    assets_dir, libraries_dir, natives_dir, version_jar_path, version_json_path, versions_dir,
};
use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use tokio::fs;
use zip::ZipArchive;

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VersionJson {
    pub id: Option<String>,
    pub inherits_from: Option<String>,
    pub main_class: Option<String>,
    pub minecraft_arguments: Option<String>,
    pub arguments: Option<Arguments>,
    pub libraries: Option<Vec<Library>>,
    pub downloads: Option<HashMap<String, Artifact>>,
    pub asset_index: Option<AssetIndex>,
    pub assets: Option<String>,
    pub java_version: Option<JavaVersionHint>,
    pub logging: Option<Logging>,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct Arguments {
    #[serde(default)]
    pub game: Vec<Value>,
    #[serde(default)]
    pub jvm: Vec<Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Library {
    pub name: String,
    pub downloads: Option<LibraryDownloads>,
    pub natives: Option<HashMap<String, String>>,
    pub rules: Option<Vec<Rule>>,
    pub extract: Option<Extract>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LibraryDownloads {
    pub artifact: Option<Artifact>,
    pub classifiers: Option<HashMap<String, Artifact>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Artifact {
    pub path: Option<String>,
    pub sha1: Option<String>,
    #[allow(dead_code)]
    pub size: Option<u64>,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Rule {
    pub action: String,
    pub os: Option<OsRule>,
    pub features: Option<HashMap<String, bool>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OsRule {
    pub name: Option<String>,
    pub arch: Option<String>,
    #[allow(dead_code)]
    pub version: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Extract {
    pub exclude: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetIndex {
    pub id: String,
    pub sha1: Option<String>,
    #[allow(dead_code)]
    pub size: Option<u64>,
    pub url: String,
    #[allow(dead_code)]
    pub total_size: Option<u64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JavaVersionHint {
    pub component: Option<String>,
    pub major_version: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Logging {
    pub client: Option<LoggingClient>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LoggingClient {
    pub argument: Option<String>,
    pub file: Option<Artifact>,
}

#[derive(Debug, Clone)]
pub struct ResolvedVersion {
    pub id: String,
    pub main_class: String,
    pub libraries: Vec<Library>,
    pub arguments: Option<Arguments>,
    pub minecraft_arguments: Option<String>,
    pub downloads: HashMap<String, Artifact>,
    pub asset_index: Option<AssetIndex>,
    pub assets: Option<String>,
    pub java_version: Option<JavaVersionHint>,
    pub logging: Option<Logging>,
}

#[derive(Debug, Deserialize)]
struct AssetIndexFile {
    objects: HashMap<String, AssetObject>,
}

#[derive(Debug, Deserialize)]
struct AssetObject {
    hash: String,
    #[allow(dead_code)]
    size: u64,
}

pub async fn resolve_version(
    http: &Client,
    catalog: &[CatalogVersion],
    id: &str,
) -> Result<ResolvedVersion> {
    let json = load_version_json(http, catalog, id).await?;
    merge_version(http, catalog, json).await
}

async fn merge_version(
    http: &Client,
    catalog: &[CatalogVersion],
    child: VersionJson,
) -> Result<ResolvedVersion> {
    let parent = if let Some(parent_id) = &child.inherits_from {
        let parent_json = load_version_json(http, catalog, parent_id).await?;
        Some(Box::pin(merge_version(http, catalog, parent_json)).await?)
    } else {
        None
    };

    let mut libraries = parent
        .as_ref()
        .map(|p| p.libraries.clone())
        .unwrap_or_default();
    if let Some(extra) = child.libraries {
        libraries.extend(extra);
    }

    let arguments = match (parent.as_ref().and_then(|p| p.arguments.clone()), child.arguments) {
        (Some(mut parent_args), Some(child_args)) => {
            parent_args.game.extend(child_args.game);
            parent_args.jvm.extend(child_args.jvm);
            Some(parent_args)
        }
        (None, Some(child_args)) => Some(child_args),
        (Some(parent_args), None) => Some(parent_args),
        (None, None) => None,
    };

    let mut downloads = parent
        .as_ref()
        .map(|p| p.downloads.clone())
        .unwrap_or_default();
    if let Some(extra) = child.downloads {
        downloads.extend(extra);
    }

    Ok(ResolvedVersion {
        id: child
            .id
            .or_else(|| parent.as_ref().map(|p| p.id.clone()))
            .unwrap_or_else(|| "unknown".into()),
        main_class: child
            .main_class
            .or_else(|| parent.as_ref().map(|p| p.main_class.clone()))
            .ok_or_else(|| WoolyError::msg("Version is missing mainClass."))?,
        libraries,
        arguments,
        minecraft_arguments: child
            .minecraft_arguments
            .or_else(|| parent.as_ref().and_then(|p| p.minecraft_arguments.clone())),
        downloads,
        asset_index: child
            .asset_index
            .or_else(|| parent.as_ref().and_then(|p| p.asset_index.clone())),
        assets: child
            .assets
            .or_else(|| parent.as_ref().and_then(|p| p.assets.clone())),
        java_version: child
            .java_version
            .or_else(|| parent.as_ref().and_then(|p| p.java_version.clone())),
        logging: child
            .logging
            .or_else(|| parent.as_ref().and_then(|p| p.logging.clone())),
    })
}

async fn load_version_json(
    http: &Client,
    catalog: &[CatalogVersion],
    id: &str,
) -> Result<VersionJson> {
    let path = version_json_path(id);
    if path.exists() {
        let raw = fs::read_to_string(&path).await?;
        return Ok(serde_json::from_str(&raw)?);
    }
    let meta = catalog
        .iter()
        .find(|item| item.id == id)
        .ok_or_else(|| {
            WoolyError::msg(format!(
                "Unknown version {id}. Refresh the catalog and try again."
            ))
        })?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await?;
    }
    let json: Value = http::get_json(http, &meta.url).await?;
    fs::write(&path, serde_json::to_vec_pretty(&json)?).await?;
    Ok(serde_json::from_value(json)?)
}

pub fn rules_allow(rules: &[Rule], features: &HashMap<&str, bool>) -> bool {
    if rules.is_empty() {
        return true;
    }
    let mut allow = false;
    for rule in rules {
        if rule_matches(rule, features) {
            allow = rule.action == "allow";
        }
    }
    allow
}

fn rule_matches(rule: &Rule, features: &HashMap<&str, bool>) -> bool {
    if let Some(os) = &rule.os {
        if let Some(name) = &os.name {
            if name != os_name() {
                return false;
            }
        }
        if let Some(arch) = &os.arch {
            if arch != os_arch() && arch != natives_arch_token() {
                return false;
            }
        }
    }
    if let Some(required) = &rule.features {
        for (key, expected) in required {
            if features.get(key.as_str()).copied().unwrap_or(false) != *expected {
                return false;
            }
        }
    }
    true
}

pub fn library_path_from_name(name: &str) -> Result<String> {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() < 3 {
        return Err(WoolyError::msg(format!("Bad library name {name}")));
    }
    let group = parts[0].replace('.', "/");
    let artifact = parts[1];
    let version = parts[2];
    let file = if let Some(classifier) = parts.get(3) {
        format!("{artifact}-{version}-{classifier}.jar")
    } else {
        format!("{artifact}-{version}.jar")
    };
    Ok(format!("{group}/{artifact}/{version}/{file}"))
}

fn artifact_file(library: &Library, artifact: &Artifact) -> Result<DownloadFile> {
    let rel = artifact
        .path
        .clone()
        .or_else(|| library_path_from_name(&library.name).ok())
        .ok_or_else(|| WoolyError::msg(format!("Library {} is missing a path.", library.name)))?;
    let url = artifact.url.clone().filter(|s| !s.is_empty());
    Ok(DownloadFile {
        path: libraries_dir().join(rel.replace('\\', "/")),
        urls: url.into_iter().collect(),
        sha1: artifact.sha1.clone(),
    })
}

pub fn library_downloads(resolved: &ResolvedVersion) -> Result<Vec<DownloadFile>> {
    let features = feature_map(false);
    let mut files = Vec::new();
    for library in &resolved.libraries {
        if !rules_allow(library.rules.as_deref().unwrap_or(&[]), &features) {
            continue;
        }
        if let Some(artifact) = library.downloads.as_ref().and_then(|d| d.artifact.as_ref()) {
            let file = artifact_file(library, artifact)?;
            if !file.urls.is_empty() {
                files.push(file);
            }
        } else if library.natives.is_none() {
            if let Ok(rel) = library_path_from_name(&library.name) {
                let maven = format!(
                    "https://libraries.minecraft.net/{}",
                    rel.replace('\\', "/")
                );
                files.push(DownloadFile {
                    path: libraries_dir().join(rel.replace('\\', "/")),
                    urls: vec![maven],
                    sha1: None,
                });
            }
        }
        if let Some(native) = native_artifact(library) {
            let file = artifact_file(library, &native)?;
            if !file.urls.is_empty() {
                files.push(file);
            }
        }
    }
    Ok(files)
}

pub fn classpath_jars(resolved: &ResolvedVersion) -> Result<Vec<PathBuf>> {
    let features = feature_map(false);
    let mut jars = Vec::new();
    for library in &resolved.libraries {
        if !rules_allow(library.rules.as_deref().unwrap_or(&[]), &features) {
            continue;
        }
        if library.name.split(':').nth(3).is_some() {
            continue;
        }
        if library.natives.is_some() && library.downloads.as_ref().and_then(|d| d.artifact.as_ref()).is_none() {
            continue;
        }
        if let Some(artifact) = library.downloads.as_ref().and_then(|d| d.artifact.as_ref()) {
            let file = artifact_file(library, artifact)?;
            jars.push(file.path);
        } else if let Ok(rel) = library_path_from_name(&library.name) {
            jars.push(libraries_dir().join(rel.replace('\\', "/")));
        }
    }
    jars.push(version_jar_path(&resolved.id));
    Ok(jars)
}

fn native_classifier(library: &Library) -> Option<String> {
    library.natives.as_ref()?.get(os_name()).map(|template| {
        template.replace("${arch}", natives_arch_token())
    })
}

fn native_artifact(library: &Library) -> Option<Artifact> {
    let classifier = native_classifier(library)?;
    library
        .downloads
        .as_ref()?
        .classifiers
        .as_ref()?
        .get(&classifier)
        .cloned()
}

pub fn extract_natives(resolved: &ResolvedVersion) -> Result<PathBuf> {
    let dest = natives_dir(&resolved.id);
    std::fs::create_dir_all(&dest)?;
    let features = feature_map(false);
    for library in &resolved.libraries {
        if !rules_allow(library.rules.as_deref().unwrap_or(&[]), &features) {
            continue;
        }
        let Some(artifact) = native_artifact(library) else {
            continue;
        };
        let file = artifact_file(library, &artifact)?;
        if !file.path.exists() {
            continue;
        }
        extract_zip(&file.path, &dest, library.extract.as_ref())?;
    }
    Ok(dest)
}

fn extract_zip(zip_path: &Path, dest: &Path, extract: Option<&Extract>) -> Result<()> {
    let file = File::open(zip_path)?;
    let mut archive = ZipArchive::new(BufReader::new(file))?;
    let excludes = extract
        .and_then(|e| e.exclude.clone())
        .unwrap_or_else(|| vec!["META-INF/".into()]);
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let name = entry.name().replace('\\', "/");
        if name.ends_with('/') {
            continue;
        }
        if excludes.iter().any(|ex| name.starts_with(ex) || name.contains("META-INF/")) {
            continue;
        }
        let out_path = dest.join(&name);
        if !out_path.starts_with(dest) {
            continue;
        }
        if let Some(parent) = out_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let mut out = File::create(out_path)?;
        std::io::copy(&mut entry, &mut out)?;
    }
    Ok(())
}

pub fn client_jar_file(resolved: &ResolvedVersion) -> Result<DownloadFile> {
    let artifact = resolved
        .downloads
        .get("client")
        .cloned()
        .ok_or_else(|| WoolyError::msg("Version is missing the client jar."))?;
    Ok(DownloadFile {
        path: version_jar_path(&resolved.id),
        urls: artifact.url.into_iter().collect(),
        sha1: artifact.sha1,
    })
}

pub fn logging_file(resolved: &ResolvedVersion) -> Option<DownloadFile> {
    let file = resolved.logging.as_ref()?.client.as_ref()?.file.as_ref()?;
    let name = file
        .path
        .clone()
        .or_else(|| file.url.as_ref().and_then(|u| u.rsplit('/').next().map(|s| s.to_string())))?;
    Some(DownloadFile {
        path: versions_dir()
            .join(&resolved.id)
            .join("log_configs")
            .join(name),
        urls: file.url.clone().into_iter().collect(),
        sha1: file.sha1.clone(),
    })
}

pub fn asset_index_file(resolved: &ResolvedVersion) -> Result<DownloadFile> {
    let index = resolved
        .asset_index
        .as_ref()
        .ok_or_else(|| WoolyError::msg("Version is missing an asset index."))?;
    Ok(DownloadFile {
        path: assets_dir().join("indexes").join(format!("{}.json", index.id)),
        urls: vec![index.url.clone()],
        sha1: index.sha1.clone(),
    })
}

pub async fn asset_object_files(index_path: &Path) -> Result<Vec<DownloadFile>> {
    let raw = fs::read_to_string(index_path).await?;
    let parsed: AssetIndexFile = serde_json::from_str(&raw)?;
    let mut objects = Vec::new();
    for object in parsed.objects.values() {
        let prefix = &object.hash[..2.min(object.hash.len())];
        let path = assets_dir().join("objects").join(prefix).join(&object.hash);
        objects.push(DownloadFile {
            path,
            urls: vec![format!(
                "https://resources.download.minecraft.net/{prefix}/{}",
                object.hash
            )],
            sha1: Some(object.hash.clone()),
        });
    }
    Ok(objects)
}

pub fn feature_map(custom_resolution: bool) -> HashMap<&'static str, bool> {
    let mut map = HashMap::new();
    map.insert("is_demo_user", false);
    map.insert("has_custom_resolution", custom_resolution);
    map.insert("has_quick_plays_support", false);
    map.insert("is_quick_play_singleplayer", false);
    map.insert("is_quick_play_multiplayer", false);
    map.insert("is_quick_play_realms", false);
    map
}

pub fn collect_args(values: &[Value], features: &HashMap<&str, bool>) -> Vec<String> {
    let mut out = Vec::new();
    for value in values {
        match value {
            Value::String(text) => out.push(text.clone()),
            Value::Object(obj) => {
                let rules: Vec<Rule> = obj
                    .get("rules")
                    .cloned()
                    .and_then(|v| serde_json::from_value(v).ok())
                    .unwrap_or_default();
                if !rules_allow(&rules, features) {
                    continue;
                }
                match obj.get("value") {
                    Some(Value::String(text)) => out.push(text.clone()),
                    Some(Value::Array(items)) => {
                        for item in items {
                            if let Some(text) = item.as_str() {
                                out.push(text.to_string());
                            }
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }
    out
}

pub fn interpolate(arg: &str, vars: &HashMap<&str, String>) -> String {
    let mut out = arg.to_string();
    for (key, value) in vars {
        out = out.replace(&format!("${{{key}}}"), value);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn library_path() {
        assert_eq!(
            library_path_from_name("com.mojang:patchy:1.3.9").unwrap(),
            "com/mojang/patchy/1.3.9/patchy-1.3.9.jar"
        );
        assert_eq!(
            library_path_from_name("org.lwjgl:lwjgl:3.3.3:natives-windows").unwrap(),
            "org/lwjgl/lwjgl/3.3.3/lwjgl-3.3.3-natives-windows.jar"
        );
    }
}
