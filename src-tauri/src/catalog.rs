use crate::error::Result;
use crate::json::{read_json_file, write_json_file};
use crate::logic::{is_supported_channel, now_ms, VERSION_MANIFEST};
use crate::model::CatalogVersion;
use crate::paths::catalog_cache_file;
use reqwest::Client;
use serde::Deserialize;
use tokio::fs;

#[derive(Default, Deserialize)]
struct CacheShape {
    #[serde(default)]
    versions: Vec<CatalogVersion>,
}

#[derive(Deserialize)]
struct Manifest {
    latest: Latest,
    versions: Vec<ManifestVersion>,
}

#[derive(Deserialize)]
struct Latest {
    release: Option<String>,
    snapshot: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestVersion {
    id: String,
    #[serde(rename = "type")]
    kind: String,
    release_time: String,
    url: String,
}

pub async fn load_catalog_cache() -> Vec<CatalogVersion> {
    let cached: CacheShape = read_json_file(&catalog_cache_file(), CacheShape::default()).await;
    cached.versions
}

pub async fn refresh_catalog(http: &Client) -> Result<Vec<CatalogVersion>> {
    let manifest: Manifest = crate::http::get_json(http, VERSION_MANIFEST).await?;
    let versions = decorate(manifest);
    if let Some(parent) = catalog_cache_file().parent() {
        fs::create_dir_all(parent).await?;
    }
    write_json_file(
        &catalog_cache_file(),
        &serde_json::json!({
            "fetchedAt": now_ms(),
            "versions": versions,
        }),
    )
    .await?;
    Ok(versions)
}

pub async fn ensure_catalog(http: &Client, memory: &mut Vec<CatalogVersion>) -> Result<Vec<CatalogVersion>> {
    if !memory.is_empty() {
        return Ok(memory.clone());
    }
    let cached = load_catalog_cache().await;
    if !cached.is_empty() {
        *memory = cached.clone();
        return Ok(cached);
    }
    let fresh = refresh_catalog(http).await?;
    *memory = fresh.clone();
    Ok(fresh)
}

pub fn find_version<'a>(memory: &'a [CatalogVersion], id: &str) -> Option<&'a CatalogVersion> {
    memory.iter().find(|item| item.id == id)
}

fn decorate(manifest: Manifest) -> Vec<CatalogVersion> {
    manifest
        .versions
        .into_iter()
        .filter(|v| is_supported_channel(&v.kind))
        .map(|v| CatalogVersion {
            latest_release: Some(manifest.latest.release.as_deref() == Some(v.id.as_str()))
                .filter(|yes| *yes),
            latest_snapshot: Some(manifest.latest.snapshot.as_deref() == Some(v.id.as_str()))
                .filter(|yes| *yes),
            id: v.id,
            kind: v.kind,
            release_time: v.release_time,
            url: v.url,
        })
        .collect()
}
