use crate::accounts::{list_public_accounts, remove_account, select_account};
use crate::auth::login_microsoft;
use crate::catalog::{ensure_catalog, find_version, refresh_catalog};
use crate::error::{Result, WoolyError};
use crate::install::install_vanilla;
use crate::instances::{
    create_instance, delete_instance, get_instance, list_instances, set_instance_version_type,
    touch_played, update_instance,
};
use crate::java::ensure_java;
use crate::launch::{is_game_running, play_instance, stop_game, watch_game_exit};
use crate::logic::version_channel_of;
use crate::model::{
    BootstrapPayload, CatalogVersion, GameInstance, InstanceDraft, InstancePatch, LaunchState,
    PublicAccount, UpdateStateView,
};
use crate::paths::{instance_game_dir, launcher_root, meta_dir};
use crate::settings::{load_settings, save_settings};
use crate::update::{check_for_updates, download_update, install_update};
use crate::AppState;
use serde_json::Value;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_opener::OpenerExt;

fn emit_launch(app: &AppHandle, phase: &str, instance_id: Option<String>, error: Option<String>) {
    let _ = app.emit(
        "wooly:event:launch",
        LaunchState {
            phase: phase.into(),
            instance_id,
            error,
        },
    );
}

#[tauri::command]
pub async fn wooly_bootstrap(app: AppHandle, state: State<'_, AppState>) -> Result<BootstrapPayload> {
    let _ = app.emit("wooly:event:splash", "Restoring your library");
    let settings = load_settings().await?;
    let accounts = list_public_accounts().await?;
    let _ = app.emit("wooly:event:splash", "Loading instances");
    let instances = list_instances().await?;
    let _ = app.emit("wooly:event:splash", "Checking Minecraft versions");
    let versions = {
        let mut catalog = state.catalog.lock().await;
        match ensure_catalog(&state.http, &mut catalog).await {
            Ok(versions) => versions,
            Err(_) => catalog.clone(),
        }
    };
    let running = is_game_running(state.game.as_ref()).await;
    Ok(BootstrapPayload {
        settings,
        accounts: accounts.accounts,
        active_account_id: accounts.active_account_id,
        instances,
        versions,
        launch: LaunchState {
            phase: if running { "running".into() } else { "idle".into() },
            instance_id: None,
            error: None,
        },
        update: state.update.lock().await.view(),
    })
}

#[tauri::command]
pub async fn wooly_settings_get() -> Result<crate::model::AppSettings> {
    load_settings().await
}

#[tauri::command]
pub async fn wooly_settings_set(patch: Value) -> Result<crate::model::AppSettings> {
    save_settings(patch).await
}

#[tauri::command]
pub async fn wooly_accounts_list() -> Result<crate::model::AccountList> {
    list_public_accounts().await
}

#[tauri::command]
pub async fn wooly_accounts_login(app: AppHandle, state: State<'_, AppState>) -> Result<PublicAccount> {
    let account = login_microsoft(&app, &state.http).await?;
    let list = list_public_accounts().await?;
    let _ = app.emit("wooly:event:accounts", list);
    Ok(account)
}

#[tauri::command]
pub async fn wooly_accounts_logout(app: AppHandle, id: String) -> Result<()> {
    remove_account(&id).await?;
    let list = list_public_accounts().await?;
    let _ = app.emit("wooly:event:accounts", list);
    Ok(())
}

#[tauri::command]
pub async fn wooly_accounts_select(app: AppHandle, id: String) -> Result<()> {
    select_account(&id).await?;
    let list = list_public_accounts().await?;
    let _ = app.emit("wooly:event:accounts", list);
    Ok(())
}

#[tauri::command]
pub async fn wooly_instances_list() -> Result<Vec<GameInstance>> {
    list_instances().await
}

#[tauri::command]
pub async fn wooly_instances_create(
    app: AppHandle,
    state: State<'_, AppState>,
    draft: InstanceDraft,
) -> Result<GameInstance> {
    let created = create_instance(draft).await?;
    let catalog = state.catalog.lock().await;
    let typed = if let Some(found) = find_version(&catalog, &created.version_id) {
        set_instance_version_type(&created.id, version_channel_of(&found.kind)).await?
    } else {
        created
    };
    let _ = app.emit("wooly:event:instances", list_instances().await?);
    Ok(typed)
}

#[tauri::command]
pub async fn wooly_instances_update(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
    patch: InstancePatch,
) -> Result<GameInstance> {
    update_instance(&id, patch.clone()).await?;
    if let Some(version_id) = patch.version_id {
        let catalog = state.catalog.lock().await;
        if let Some(found) = find_version(&catalog, &version_id) {
            set_instance_version_type(&id, version_channel_of(&found.kind)).await?;
        }
    }
    let _ = app.emit("wooly:event:instances", list_instances().await?);
    get_instance(&id).await
}

#[tauri::command]
pub async fn wooly_instances_delete(app: AppHandle, id: String) -> Result<()> {
    delete_instance(&id).await?;
    let _ = app.emit("wooly:event:instances", list_instances().await?);
    Ok(())
}

#[tauri::command]
pub async fn wooly_catalog_versions(state: State<'_, AppState>) -> Result<Vec<CatalogVersion>> {
    let mut catalog = state.catalog.lock().await;
    ensure_catalog(&state.http, &mut catalog).await
}

#[tauri::command]
pub async fn wooly_catalog_refresh(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<CatalogVersion>> {
    let versions = refresh_catalog(&state.http).await?;
    *state.catalog.lock().await = versions.clone();
    let _ = app.emit("wooly:event:catalog", &versions);
    Ok(versions)
}

#[tauri::command]
pub async fn wooly_install_start(app: AppHandle, state: State<'_, AppState>, instance_id: String) -> Result<()> {
    let instance = get_instance(&instance_id).await?;
    emit_launch(&app, "installing", Some(instance_id.clone()), None);
    state.cancel_install.store(false, Ordering::Relaxed);
    let catalog = state.catalog.lock().await.clone();
    let http = state.http.clone();
    let cancel = &state.cancel_install;
    let app_progress = app.clone();
    match install_vanilla(&http, &catalog, &instance.version_id, cancel, |progress| {
        let _ = app_progress.emit("wooly:event:install", progress);
    })
    .await
    {
        Ok(resolved) => {
            let java_app = app.clone();
            ensure_java(
                &http,
                resolved.java_version.as_ref(),
                instance.java_path.as_deref(),
                cancel,
                |label, current, total| {
                    let _ = java_app.emit(
                        "wooly:event:install",
                        crate::model::InstallProgress {
                            phase: "java".into(),
                            label,
                            current,
                            total,
                            speed: 0,
                        },
                    );
                },
            )
            .await?;
            emit_launch(&app, "idle", Some(instance_id), None);
            Ok(())
        }
        Err(error) => {
            emit_launch(&app, "idle", Some(instance_id), Some(error.0.clone()));
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn wooly_install_cancel(state: State<'_, AppState>) -> Result<()> {
    state.cancel_install.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
pub async fn wooly_launch_play(app: AppHandle, state: State<'_, AppState>, instance_id: String) -> Result<()> {
    let instance = get_instance(&instance_id).await?;
    if crate::accounts::get_active_account().await?.is_none() {
        let message = "Sign in with a premium Microsoft account before playing.";
        emit_launch(&app, "idle", Some(instance_id), Some(message.into()));
        return Err(WoolyError::msg(message));
    }
    emit_launch(&app, "installing", Some(instance_id.clone()), None);
    state.cancel_install.store(false, Ordering::Relaxed);
    let catalog = state.catalog.lock().await.clone();
    let http = state.http.clone();
    let app_progress = app.clone();
    let resolved = match install_vanilla(
        &http,
        &catalog,
        &instance.version_id,
        &state.cancel_install,
        |progress| {
            let _ = app_progress.emit("wooly:event:install", progress);
        },
    )
    .await
    {
        Ok(resolved) => resolved,
        Err(error) => {
            emit_launch(&app, "idle", Some(instance_id), Some(error.0.clone()));
            return Err(error);
        }
    };

    let java_app = app.clone();
    let java_path = match ensure_java(
        &http,
        resolved.java_version.as_ref(),
        instance.java_path.as_deref(),
        &state.cancel_install,
        |label, current, total| {
            crate::launch::emit_log(
                &java_app,
                "launcher",
                if total > 0 {
                    format!("{label} {}%", (current * 100) / total)
                } else {
                    label
                },
            );
        },
    )
    .await
    {
        Ok(path) => path,
        Err(error) => {
            emit_launch(&app, "idle", Some(instance_id), Some(error.0.clone()));
            return Err(error);
        }
    };

    emit_launch(&app, "launching", Some(instance_id.clone()), None);
    if let Err(error) = play_instance(
        app.clone(),
        &http,
        state.game.as_ref(),
        &instance,
        &resolved,
        &java_path,
    )
    .await
    {
        emit_launch(&app, "idle", Some(instance_id), Some(error.0.clone()));
        return Err(error);
    }

    touch_played(&instance_id).await?;
    let _ = app.emit("wooly:event:instances", list_instances().await?);
    emit_launch(&app, "running", Some(instance_id.clone()), None);
    let settings = load_settings().await?;
    if !settings.keep_open_on_launch {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.minimize();
        }
    }

    let watcher_app = app.clone();
    let game = state.game.clone();
    tauri::async_runtime::spawn(async move {
        watch_game_exit(watcher_app, game).await;
    });
    Ok(())
}

#[tauri::command]
pub async fn wooly_launch_stop(app: AppHandle, state: State<'_, AppState>) -> Result<()> {
    emit_launch(&app, "stopping", None, None);
    stop_game(state.game.as_ref()).await
}

#[tauri::command]
pub async fn wooly_open_path(
    app: AppHandle,
    kind: String,
    instance_id: Option<String>,
) -> Result<()> {
    let target = match kind.as_str() {
        "root" => launcher_root(),
        "meta" => meta_dir(),
        _ => instance_game_dir(instance_id.as_deref().unwrap_or("missing")),
    };
    tokio::fs::create_dir_all(&target).await?;
    app.opener()
        .open_path(target.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|e| WoolyError::msg(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn wooly_update_check(app: AppHandle, state: State<'_, AppState>) -> Result<UpdateStateView> {
    check_for_updates(&app, &state.http, &state.update, true).await
}

#[tauri::command]
pub async fn wooly_update_download(app: AppHandle, state: State<'_, AppState>) -> Result<()> {
    download_update(&app, &state.http, &state.update).await
}

#[tauri::command]
pub async fn wooly_update_install(app: AppHandle, state: State<'_, AppState>) -> Result<()> {
    install_update(&app, &state.update).await
}
