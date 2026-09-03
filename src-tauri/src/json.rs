use crate::error::Result;
use serde::de::DeserializeOwned;
use std::path::Path;
use tokio::fs;

pub async fn read_json_file<T: DeserializeOwned>(file: &Path, fallback: T) -> T {
    match fs::read_to_string(file).await {
        Ok(raw) => serde_json::from_str(&raw).unwrap_or(fallback),
        Err(_) => fallback,
    }
}

pub async fn write_json_file(file: &Path, value: &impl serde::Serialize) -> Result<()> {
    if let Some(parent) = file.parent() {
        fs::create_dir_all(parent).await?;
    }
    let tmp = file.with_file_name(format!(
        "{}.{}.tmp",
        file.file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("data"),
        std::process::id()
    ));
    let body = serde_json::to_string_pretty(value)?;
    fs::write(&tmp, body).await?;
    fs::rename(&tmp, file).await?;
    Ok(())
}
