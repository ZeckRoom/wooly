use crate::error::{Result, WoolyError};
use crate::json::{read_json_file, write_json_file};
use crate::logic::{
    now_iso, validate_instance, version_channel_of, DEFAULT_MEMORY_MAX, DEFAULT_MEMORY_MIN,
};
use crate::model::{GameInstance, InstanceDraft, InstancePatch};
use crate::paths::{instance_game_dir, instance_root, instances_file};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tokio::fs;
use uuid::Uuid;

#[derive(Default, Clone, Serialize, Deserialize)]
struct StoreShape {
    #[serde(default)]
    instances: Vec<GameInstance>,
}

static CACHE: Mutex<Option<StoreShape>> = Mutex::new(None);

async fn load() -> Result<StoreShape> {
    if let Some(cached) = CACHE.lock().ok().and_then(|g| g.clone()) {
        return Ok(cached);
    }
    let data = read_json_file(&instances_file(), StoreShape::default()).await;
    if let Ok(mut guard) = CACHE.lock() {
        *guard = Some(data.clone());
    }
    Ok(data)
}

async fn persist(data: &StoreShape) -> Result<()> {
    write_json_file(&instances_file(), data).await?;
    if let Ok(mut guard) = CACHE.lock() {
        *guard = Some(data.clone());
    }
    Ok(())
}

pub async fn list_instances() -> Result<Vec<GameInstance>> {
    Ok(load().await?.instances)
}

pub async fn get_instance(id: &str) -> Result<GameInstance> {
    load()
        .await?
        .instances
        .into_iter()
        .find(|item| item.id == id)
        .ok_or_else(|| WoolyError::msg("Instance not found."))
}

pub async fn create_instance(draft: InstanceDraft) -> Result<GameInstance> {
    let mut data = load().await?;
    let name = crate::logic::normalize_instance_name(&draft.name);
    let memory_min = draft.memory_min_mb.unwrap_or(DEFAULT_MEMORY_MIN);
    let memory_max = draft.memory_max_mb.unwrap_or(DEFAULT_MEMORY_MAX);
    validate_instance(
        &name,
        &draft.group,
        &draft.version_id,
        memory_min,
        memory_max,
        &data.instances.iter().map(|i| i.name.clone()).collect::<Vec<_>>(),
        None,
    )
    .map_err(WoolyError::msg)?;

    let version_id = draft.version_id.trim().to_string();
    let version_type = if version_id.contains('w') {
        "snapshot"
    } else {
        "release"
    };

    let instance = GameInstance {
        id: Uuid::new_v4().to_string(),
        name,
        group: draft.group,
        version_id,
        version_type: version_type.into(),
        created_at: now_iso(),
        last_played_at: None,
        memory_min_mb: memory_min,
        memory_max_mb: memory_max,
        java_path: draft.java_path.filter(|s| !s.trim().is_empty()),
        jvm_args: draft.jvm_args.unwrap_or_default().trim().to_string(),
        width: draft.width.unwrap_or(1280),
        height: draft.height.unwrap_or(720),
        fullscreen: draft.fullscreen.unwrap_or(false),
    };
    fs::create_dir_all(instance_game_dir(&instance.id)).await?;
    data.instances.insert(0, instance.clone());
    persist(&data).await?;
    Ok(instance)
}

pub async fn update_instance(id: &str, patch: InstancePatch) -> Result<GameInstance> {
    let mut data = load().await?;
    let index = data
        .instances
        .iter()
        .position(|item| item.id == id)
        .ok_or_else(|| WoolyError::msg("Instance not found."))?;
    let current = data.instances[index].clone();
    let next_name = patch
        .name
        .as_deref()
        .map(crate::logic::normalize_instance_name)
        .unwrap_or_else(|| current.name.clone());
    let group = patch.group.clone().unwrap_or_else(|| current.group.clone());
    let version_id = patch
        .version_id
        .clone()
        .unwrap_or_else(|| current.version_id.clone());
    let memory_max = patch.memory_max_mb.unwrap_or(current.memory_max_mb);
    let memory_min = patch.memory_min_mb.unwrap_or(current.memory_min_mb);
    validate_instance(
        &next_name,
        &group,
        &version_id,
        memory_min,
        memory_max,
        &data.instances.iter().map(|i| i.name.clone()).collect::<Vec<_>>(),
        Some(&current.name),
    )
    .map_err(WoolyError::msg)?;

    let updated = GameInstance {
        id: current.id,
        name: next_name,
        group,
        version_id,
        version_type: patch
            .version_type
            .unwrap_or(current.version_type),
        created_at: current.created_at,
        last_played_at: match patch.last_played_at {
            Some(value) => value,
            None => current.last_played_at,
        },
        memory_min_mb: memory_min,
        memory_max_mb: memory_max,
        java_path: match patch.java_path {
            Some(value) => value.filter(|s| !s.trim().is_empty()),
            None => current.java_path,
        },
        jvm_args: patch
            .jvm_args
            .map(|s| s.trim().to_string())
            .unwrap_or(current.jvm_args),
        width: patch.width.unwrap_or(current.width),
        height: patch.height.unwrap_or(current.height),
        fullscreen: patch.fullscreen.unwrap_or(current.fullscreen),
    };
    data.instances[index] = updated.clone();
    persist(&data).await?;
    Ok(updated)
}

pub async fn delete_instance(id: &str) -> Result<()> {
    let mut data = load().await?;
    data.instances.retain(|item| item.id != id);
    persist(&data).await?;
    let _ = fs::remove_dir_all(instance_root(id)).await;
    Ok(())
}

pub async fn touch_played(id: &str) -> Result<GameInstance> {
    update_instance(
        id,
        InstancePatch {
            last_played_at: Some(Some(now_iso())),
            ..Default::default()
        },
    )
    .await
}

pub async fn set_instance_version_type(id: &str, version_type: &str) -> Result<GameInstance> {
    update_instance(
        id,
        InstancePatch {
            version_type: Some(version_channel_of(version_type).to_string()),
            ..Default::default()
        },
    )
    .await
}
