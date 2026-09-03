use crate::error::Result;
use crate::json::{read_json_file, write_json_file};
use crate::logic::resolve_ms_client_id;
use crate::model::AppSettings;
use crate::paths::settings_file;
use serde::Deserialize;
use std::sync::Mutex;

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredSettings {
    microsoft_client_id: Option<String>,
    keep_open_on_launch: Option<bool>,
    language: Option<String>,
}

static CACHE: Mutex<Option<AppSettings>> = Mutex::new(None);

fn env_client_id() -> Option<String> {
    std::env::var("WOOLY_MS_CLIENT_ID").ok()
}

pub async fn load_settings() -> Result<AppSettings> {
    if let Some(cached) = CACHE.lock().ok().and_then(|g| g.clone()) {
        return Ok(cached);
    }
    let stored: StoredSettings = read_json_file(&settings_file(), StoredSettings::default()).await;
    let settings = AppSettings {
        microsoft_client_id: resolve_ms_client_id(
            stored.microsoft_client_id.as_deref(),
            env_client_id().as_deref(),
        ),
        keep_open_on_launch: stored.keep_open_on_launch.unwrap_or(true),
        language: "en".into(),
    };
    if let Ok(mut guard) = CACHE.lock() {
        *guard = Some(settings.clone());
    }
    let _ = stored.language;
    Ok(settings)
}

pub async fn save_settings(patch: serde_json::Value) -> Result<AppSettings> {
    let mut current = load_settings().await?;
    if let Some(keep) = patch.get("keepOpenOnLaunch").and_then(|v| v.as_bool()) {
        current.keep_open_on_launch = keep;
    }
    if let Some(id) = patch.get("microsoftClientId").and_then(|v| v.as_str()) {
        current.microsoft_client_id = resolve_ms_client_id(Some(id), env_client_id().as_deref());
    } else {
        current.microsoft_client_id =
            resolve_ms_client_id(Some(&current.microsoft_client_id), env_client_id().as_deref());
    }
    current.language = "en".into();
    write_json_file(&settings_file(), &current).await?;
    if let Ok(mut guard) = CACHE.lock() {
        *guard = Some(current.clone());
    }
    Ok(current)
}
