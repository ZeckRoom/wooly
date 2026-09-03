use crate::download::{download_files, DownloadFile};
use crate::error::{Result, WoolyError};
use crate::model::{CatalogVersion, InstallProgress};
use crate::version::{
    asset_index_file, asset_object_files, client_jar_file, library_downloads, logging_file,
    resolve_version, ResolvedVersion,
};
use reqwest::Client;
use std::sync::atomic::AtomicBool;
use tokio::fs;

pub async fn install_vanilla(
    http: &Client,
    catalog: &[CatalogVersion],
    version_id: &str,
    cancel: &AtomicBool,
    mut on_progress: impl FnMut(InstallProgress),
) -> Result<ResolvedVersion> {
    if crate::catalog::find_version(catalog, version_id).is_none() {
        return Err(WoolyError::msg(format!(
            "Unknown version {version_id}. Refresh the catalog and try again."
        )));
    }

    let report = |phase: &str, label: String, current: u64, total: u64, on_progress: &mut dyn FnMut(InstallProgress)| {
        on_progress(InstallProgress {
            phase: phase.into(),
            label,
            current,
            total,
            speed: 0,
        });
    };

    report(
        "version.json",
        format!("Version index {version_id}"),
        1,
        10,
        &mut on_progress,
    );
    fs::create_dir_all(crate::paths::meta_dir()).await?;
    let resolved = resolve_version(http, catalog, version_id).await?;

    let mut files: Vec<DownloadFile> = Vec::new();
    files.push(client_jar_file(&resolved)?);
    files.extend(library_downloads(&resolved)?);
    if let Some(logging) = logging_file(&resolved) {
        files.push(logging);
    }

    report(
        "version.jar",
        format!("Client {}", resolved.id),
        3,
        10,
        &mut on_progress,
    );
    download_files(http, files, cancel, |done, total| {
        on_progress(InstallProgress {
            phase: "files".into(),
            label: format!("Downloading files {done}/{total}"),
            current: done,
            total,
            speed: 0,
        });
    })
    .await?;

    report("assets", "Assets index".into(), 7, 10, &mut on_progress);
    let index = asset_index_file(&resolved)?;
    download_files(http, vec![index.clone()], cancel, |_, _| {}).await?;
    let objects = asset_object_files(&index.path).await?;
    report("assets.assets", "Assets".into(), 8, 10, &mut on_progress);
    download_files(http, objects, cancel, |done, total| {
        on_progress(InstallProgress {
            phase: "assets".into(),
            label: format!("Downloading assets {done}/{total}"),
            current: done,
            total,
            speed: 0,
        });
    })
    .await?;

    report(
        "done",
        format!("Installed {}", resolved.id),
        10,
        10,
        &mut on_progress,
    );
    Ok(resolved)
}
