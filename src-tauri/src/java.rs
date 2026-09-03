use crate::download::{download_files, DownloadFile};
use crate::error::{Result, WoolyError};
use crate::logic::{java_executable_name, java_platform_key, java_runtime_for, JAVA_RUNTIME_ALL};
use crate::paths::runtimes_dir;
use crate::version::JavaVersionHint;
use reqwest::Client;
use serde_json::Value;
use std::sync::atomic::AtomicBool;
use tokio::fs;

pub async fn ensure_java(
    http: &Client,
    hint: Option<&JavaVersionHint>,
    custom_path: Option<&str>,
    cancel: &AtomicBool,
    mut on_progress: impl FnMut(String, u64, u64),
) -> Result<String> {
    if let Some(path) = custom_path.map(str::trim).filter(|s| !s.is_empty()) {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
        return Err(WoolyError::msg("Custom Java path was not found."));
    }

    let component = java_runtime_for(
        hint.and_then(|h| h.component.as_deref()),
        hint.and_then(|h| h.major_version),
    );
    let home = runtimes_dir().join(&component);
    let binary = home.join("bin").join(java_executable_name());
    if binary.exists() {
        return Ok(binary.to_string_lossy().into_owned());
    }

    on_progress("Downloading Java runtime".into(), 0, 1);
    fs::create_dir_all(&home).await?;
    let files = java_files(http, &component, &home).await?;
    download_files(http, files, cancel, |done, total| {
        on_progress("Downloading Java runtime".into(), done, total);
    })
    .await?;

    if !binary.exists() {
        return Err(WoolyError::msg(format!(
            "Java runtime {component} did not install a launcher binary."
        )));
    }
    Ok(binary.to_string_lossy().into_owned())
}

async fn java_files(http: &Client, component: &str, home: &std::path::Path) -> Result<Vec<DownloadFile>> {
    let index: Value = crate::http::get_json(http, JAVA_RUNTIME_ALL).await?;
    let platform = java_platform_key();
    let target = index
        .get(platform)
        .and_then(|v| v.get(component))
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.first())
        .ok_or_else(|| {
            WoolyError::msg(format!(
                "No official Java runtime named {component} for this platform."
            ))
        })?;
    let manifest_url = target
        .pointer("/manifest/url")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Java runtime manifest URL is missing."))?;
    let manifest: Value = crate::http::get_json(http, manifest_url).await?;
    let files = manifest
        .get("files")
        .and_then(Value::as_object)
        .ok_or_else(|| WoolyError::msg("Java runtime manifest has no files."))?;

    let mut out = Vec::new();
    for (rel, meta) in files {
        let kind = meta.get("type").and_then(Value::as_str).unwrap_or("");
        if kind == "directory" {
            fs::create_dir_all(home.join(rel)).await?;
            continue;
        }
        if kind != "file" {
            continue;
        }
        let downloads = meta.get("downloads").and_then(Value::as_object);
        let raw = downloads.and_then(|d| d.get("raw"));
        let url = raw
            .and_then(|v| v.get("url"))
            .and_then(Value::as_str)
            .ok_or_else(|| WoolyError::msg(format!("Java file {rel} is missing a download URL.")))?;
        let sha1 = raw
            .and_then(|v| v.get("sha1"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned);
        out.push(DownloadFile {
            path: home.join(rel),
            urls: vec![url.to_string()],
            sha1,
        });
    }
    Ok(out)
}
