use crate::error::{Result, WoolyError};
use futures::StreamExt;
use reqwest::Client;
use sha1::{Digest, Sha1};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tokio::sync::Semaphore;

#[derive(Clone)]
pub struct DownloadFile {
    pub path: PathBuf,
    pub urls: Vec<String>,
    pub sha1: Option<String>,
}

pub async fn download_files(
    http: &Client,
    files: Vec<DownloadFile>,
    cancel: &AtomicBool,
    mut on_progress: impl FnMut(u64, u64),
) -> Result<()> {
    let total = files.len() as u64;
    if total == 0 {
        on_progress(0, 0);
        return Ok(());
    }
    let semaphore = Arc::new(Semaphore::new(16));
    let mut handles = Vec::new();
    for file in files {
        if cancel.load(Ordering::Relaxed) {
            return Err(WoolyError::msg("Install cancelled."));
        }
        let http = http.clone();
        let permit = semaphore.clone().acquire_owned().await.expect("semaphore");
        handles.push(tokio::spawn(async move {
            let result = download_one(&http, &file).await;
            drop(permit);
            result
        }));
    }

    let mut completed = 0u64;
    for handle in handles {
        if cancel.load(Ordering::Relaxed) {
            return Err(WoolyError::msg("Install cancelled."));
        }
        handle
            .await
            .map_err(|e| WoolyError::msg(e.to_string()))??;
        completed += 1;
        on_progress(completed, total);
    }
    Ok(())
}

async fn download_one(http: &Client, file: &DownloadFile) -> Result<()> {
    if let Some(parent) = file.path.parent() {
        fs::create_dir_all(parent).await?;
    }
    if let Some(sha) = &file.sha1 {
        if matches_sha1(&file.path, sha).await {
            return Ok(());
        }
    }

    let mut last_error = WoolyError::msg(format!("Failed to download {}", file.path.display()));
    for url in &file.urls {
        match fetch_to_path(http, url, &file.path, file.sha1.as_deref()).await {
            Ok(()) => return Ok(()),
            Err(error) => last_error = error,
        }
    }
    Err(last_error)
}

async fn fetch_to_path(http: &Client, url: &str, path: &Path, sha1: Option<&str>) -> Result<()> {
    let response = http.get(url).send().await?;
    if !response.status().is_success() {
        return Err(WoolyError::msg(format!("{url} -> {}", response.status())));
    }
    let tmp = path.with_file_name(format!(
        "{}.part",
        path.file_name().and_then(|s| s.to_str()).unwrap_or("download")
    ));
    if let Some(parent) = tmp.parent() {
        fs::create_dir_all(parent).await?;
    }
    let mut out = fs::File::create(&tmp).await?;
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        out.write_all(&chunk?).await?;
    }
    out.flush().await?;
    drop(out);
    if let Some(expected) = sha1 {
        if !matches_sha1(&tmp, expected).await {
            let _ = fs::remove_file(&tmp).await;
            return Err(WoolyError::msg(format!(
                "Checksum mismatch for {}",
                path.display()
            )));
        }
    }
    fs::rename(&tmp, path).await?;
    Ok(())
}

pub async fn matches_sha1(path: &Path, expected: &str) -> bool {
    let Ok(bytes) = fs::read(path).await else {
        return false;
    };
    let mut hasher = Sha1::new();
    hasher.update(&bytes);
    hex::encode(hasher.finalize()) == expected.to_ascii_lowercase()
}
