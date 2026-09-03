use crate::error::{Result, WoolyError};
use crate::logic::{
    is_launcher_update, update_download_percent, update_feed_error_message, GITHUB_REPO,
};
use crate::model::UpdateStateView;
use futures::StreamExt;
use reqwest::Client;
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct UpdateState {
    pub phase: String,
    pub current_version: String,
    pub available_version: Option<String>,
    pub percent: u32,
    pub error: Option<String>,
    pub download_url: Option<String>,
    pub installer_path: Option<PathBuf>,
}

impl UpdateState {
    pub fn view(&self) -> UpdateStateView {
        UpdateStateView {
            phase: self.phase.clone(),
            current_version: self.current_version.clone(),
            available_version: self.available_version.clone(),
            percent: self.percent,
            error: self.error.clone(),
        }
    }
}

pub fn idle(current_version: String) -> UpdateState {
    UpdateState {
        phase: "idle".into(),
        current_version,
        available_version: None,
        percent: 0,
        error: None,
        download_url: None,
        installer_path: None,
    }
}

pub type UpdateSlot = Arc<Mutex<UpdateState>>;

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
    assets: Vec<GithubAsset>,
}

#[derive(Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
    size: Option<u64>,
}

fn emit(app: &AppHandle, state: &UpdateState) {
    let _ = app.emit("wooly:event:update", state.view());
}

fn packaged(app: &AppHandle) -> bool {
    app.path()
        .resource_dir()
        .ok()
        .map(|dir| !cfg!(debug_assertions) && dir.exists())
        .unwrap_or(!cfg!(debug_assertions))
}

pub fn setup(app: AppHandle, http: Client, slot: UpdateSlot) {
    if cfg!(debug_assertions) {
        return;
    }
    let delayed = app.clone();
    let delayed_http = http.clone();
    let delayed_slot = slot.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(2500)).await;
        let _ = check_for_updates(&delayed, &delayed_http, &delayed_slot, false).await;
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(4 * 60 * 60));
        interval.tick().await;
        loop {
            interval.tick().await;
            let _ = check_for_updates(&delayed, &delayed_http, &delayed_slot, false).await;
        }
    });
}

pub async fn check_for_updates(
    app: &AppHandle,
    http: &Client,
    slot: &UpdateSlot,
    from_user: bool,
) -> Result<UpdateStateView> {
    if cfg!(debug_assertions) || !packaged(app) {
        if from_user {
            let mut state = slot.lock().await;
            state.phase = "error".into();
            state.error = Some(
                "In-app updates only work in the installed Wooly app, not in `pnpm dev`.".into(),
            );
            emit(app, &state);
            return Ok(state.view());
        }
        return Ok(slot.lock().await.view());
    }

    let url = format!("https://api.github.com/repos/{GITHUB_REPO}/releases/latest");
    let response = match http
        .get(&url)
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
    {
        Ok(response) => response,
        Err(error) => {
            let mut state = slot.lock().await;
            state.phase = "error".into();
            state.error = Some(update_feed_error_message(&error.to_string()));
            emit(app, &state);
            return Ok(state.view());
        }
    };

    let status = response.status();
    if status.as_u16() == 404 {
        let mut state = slot.lock().await;
        state.phase = "error".into();
        state.error = Some(update_feed_error_message("HttpError: 404 Not Found"));
        emit(app, &state);
        return Ok(state.view());
    }
    if !status.is_success() {
        let mut state = slot.lock().await;
        state.phase = "error".into();
        state.error = Some(update_feed_error_message(&format!("Request failed ({status})")));
        emit(app, &state);
        return Ok(state.view());
    }

    let release: GithubRelease = match response.json().await {
        Ok(release) => release,
        Err(error) => {
            let mut state = slot.lock().await;
            state.phase = "error".into();
            state.error = Some(update_feed_error_message(&error.to_string()));
            emit(app, &state);
            return Ok(state.view());
        }
    };

    let available = release.tag_name.trim_start_matches('v').to_string();
    let mut state = slot.lock().await;
    if !is_launcher_update(&state.current_version, &available) {
        if state.phase != "downloading" && state.phase != "ready" {
            let current = state.current_version.clone();
            *state = idle(current);
            emit(app, &state);
        }
        return Ok(state.view());
    }

    let asset = release.assets.iter().find(|asset| {
        let name = asset.name.to_ascii_lowercase();
        name.ends_with(".exe") && (name.contains("setup") || name.contains("nsis") || name.contains("wooly"))
    });
    let Some(asset) = asset.or(release.assets.iter().find(|a| a.name.ends_with(".exe"))) else {
        state.phase = "error".into();
        state.error = Some("The latest GitHub Release does not include a Windows installer.".into());
        emit(app, &state);
        return Ok(state.view());
    };

    state.phase = "available".into();
    state.available_version = Some(available);
    state.percent = 0;
    state.error = None;
    state.download_url = Some(asset.browser_download_url.clone());
    let _ = asset.size;
    emit(app, &state);
    Ok(state.view())
}

pub async fn download_update(app: &AppHandle, http: &Client, slot: &UpdateSlot) -> Result<()> {
    if cfg!(debug_assertions) {
        return Ok(());
    }
    let (url, version) = {
        let mut state = slot.lock().await;
        let url = state
            .download_url
            .clone()
            .ok_or_else(|| WoolyError::msg("No update is available to download."))?;
        state.phase = "downloading".into();
        state.percent = state.percent.max(1);
        state.error = None;
        emit(app, &state);
        (url, state.available_version.clone().unwrap_or_else(|| "update".into()))
    };

    let response = http.get(&url).send().await?;
    if !response.status().is_success() {
        let mut state = slot.lock().await;
        state.phase = "error".into();
        state.error = Some(format!("Could not download the update ({})", response.status()));
        emit(app, &state);
        return Err(WoolyError::msg(state.error.clone().unwrap_or_default()));
    }
    let total = response.content_length().unwrap_or(0);
    let dir = std::env::temp_dir().join("wooly-launcher-updates");
    tokio::fs::create_dir_all(&dir).await?;
    let path = dir.join(format!("wooly-launcher-{version}-setup.exe"));
    let mut file = tokio::fs::File::create(&path).await?;
    let mut stream = response.bytes_stream();
    let mut transferred = 0u64;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        transferred += chunk.len() as u64;
        file.write_all(&chunk).await?;
        let mut state = slot.lock().await;
        state.percent = if total > 0 {
            update_download_percent(transferred, total)
        } else {
            state.percent.max(1)
        };
        state.phase = "downloading".into();
        emit(app, &state);
    }
    file.flush().await?;

    let mut state = slot.lock().await;
    state.phase = "ready".into();
    state.percent = 100;
    state.installer_path = Some(path);
    emit(app, &state);
    Ok(())
}

pub async fn install_update(app: &AppHandle, slot: &UpdateSlot) -> Result<()> {
    let path = slot
        .lock()
        .await
        .installer_path
        .clone()
        .ok_or_else(|| WoolyError::msg("Download the update before installing it."))?;
    std::process::Command::new(&path)
        .spawn()
        .map_err(|e| WoolyError::msg(e.to_string()))?;
    app.exit(0);
    Ok(())
}
