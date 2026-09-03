use std::path::PathBuf;

/// Keep the Electron userData folder so existing instances are not orphaned.
pub fn launcher_root() -> PathBuf {
    if let Ok(custom) = std::env::var("WOOLY_DATA_DIR") {
        let trimmed = custom.trim();
        if !trimmed.is_empty() {
            return PathBuf::from(trimmed);
        }
    }
    if let Some(appdata) = std::env::var_os("APPDATA") {
        return PathBuf::from(appdata).join("wooly-launcher");
    }
    dirs_fallback().join("wooly-launcher")
}

fn dirs_fallback() -> PathBuf {
    if let Some(home) = std::env::var_os("HOME") {
        return PathBuf::from(home).join(".local").join("share");
    }
    PathBuf::from(".")
}

pub fn meta_dir() -> PathBuf {
    launcher_root().join("meta")
}

pub fn instances_dir() -> PathBuf {
    launcher_root().join("instances")
}

pub fn instance_root(id: &str) -> PathBuf {
    instances_dir().join(id)
}

pub fn instance_game_dir(id: &str) -> PathBuf {
    instance_root(id).join("game")
}

pub fn runtimes_dir() -> PathBuf {
    meta_dir().join("runtimes")
}

pub fn cache_dir() -> PathBuf {
    launcher_root().join("cache")
}

pub fn accounts_file() -> PathBuf {
    launcher_root().join("accounts.json")
}

pub fn settings_file() -> PathBuf {
    launcher_root().join("settings.json")
}

pub fn instances_file() -> PathBuf {
    launcher_root().join("instances.json")
}

pub fn catalog_cache_file() -> PathBuf {
    cache_dir().join("version_manifest.json")
}

pub fn libraries_dir() -> PathBuf {
    meta_dir().join("libraries")
}

pub fn assets_dir() -> PathBuf {
    meta_dir().join("assets")
}

pub fn versions_dir() -> PathBuf {
    meta_dir().join("versions")
}

pub fn version_json_path(id: &str) -> PathBuf {
    versions_dir().join(id).join(format!("{id}.json"))
}

pub fn version_jar_path(id: &str) -> PathBuf {
    versions_dir().join(id).join(format!("{id}.jar"))
}

pub fn natives_dir(id: &str) -> PathBuf {
    versions_dir().join(id).join("natives")
}
