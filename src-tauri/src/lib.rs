mod accounts;
mod auth;
mod catalog;
mod commands;
mod crypto;
mod download;
mod error;
mod http;
mod install;
mod instances;
mod java;
mod json;
mod launch;
mod logic;
mod model;
mod paths;
mod settings;
mod update;
mod version;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::Mutex;

pub struct AppState {
    pub http: reqwest::Client,
    pub catalog: Mutex<Vec<model::CatalogVersion>>,
    pub cancel_install: AtomicBool,
    pub game: Arc<Mutex<Option<launch::GameProcess>>>,
    pub update: update::UpdateSlot,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let http = http::client();
            let update_slot = Arc::new(Mutex::new(update::idle(
                app.package_info().version.to_string(),
            )));
            let state = AppState {
                http: http.clone(),
                catalog: Mutex::new(Vec::new()),
                cancel_install: AtomicBool::new(false),
                game: Arc::new(Mutex::new(None)),
                update: update_slot.clone(),
            };
            update::setup(app.handle().clone(), http, update_slot);
            app.manage(state);
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(
                event,
                tauri::WindowEvent::Resized(_)
                    | tauri::WindowEvent::ScaleFactorChanged { .. }
            ) {
                if let Ok(maximized) = window.is_maximized() {
                    let _ = window.emit("wooly:event:maximized", maximized);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::wooly_bootstrap,
            commands::wooly_settings_get,
            commands::wooly_settings_set,
            commands::wooly_accounts_list,
            commands::wooly_accounts_login,
            commands::wooly_accounts_logout,
            commands::wooly_accounts_select,
            commands::wooly_instances_list,
            commands::wooly_instances_create,
            commands::wooly_instances_update,
            commands::wooly_instances_delete,
            commands::wooly_catalog_versions,
            commands::wooly_catalog_refresh,
            commands::wooly_install_start,
            commands::wooly_install_cancel,
            commands::wooly_launch_play,
            commands::wooly_launch_stop,
            commands::wooly_open_path,
            commands::wooly_update_check,
            commands::wooly_update_download,
            commands::wooly_update_install
        ])
        .run(tauri::generate_context!())
        .expect("error while running Wooly");
}
