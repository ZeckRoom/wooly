use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameInstance {
    pub id: String,
    pub name: String,
    pub group: String,
    pub version_id: String,
    pub version_type: String,
    pub created_at: String,
    pub last_played_at: Option<String>,
    pub memory_min_mb: u32,
    pub memory_max_mb: u32,
    pub java_path: Option<String>,
    pub jvm_args: String,
    pub width: u32,
    pub height: u32,
    pub fullscreen: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstanceDraft {
    pub name: String,
    pub group: String,
    pub version_id: String,
    pub memory_max_mb: Option<u32>,
    pub memory_min_mb: Option<u32>,
    pub java_path: Option<String>,
    pub jvm_args: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fullscreen: Option<bool>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstancePatch {
    pub name: Option<String>,
    pub group: Option<String>,
    pub version_id: Option<String>,
    pub memory_max_mb: Option<u32>,
    pub memory_min_mb: Option<u32>,
    pub java_path: Option<Option<String>>,
    pub jvm_args: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fullscreen: Option<bool>,
    pub last_played_at: Option<Option<String>>,
    pub version_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogVersion {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub release_time: String,
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_release: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_snapshot: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicAccount {
    pub id: String,
    pub username: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xbox_gamertag: Option<String>,
    pub avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub microsoft_client_id: String,
    pub keep_open_on_launch: bool,
    pub language: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogLine {
    pub id: u64,
    pub ts: u64,
    pub stream: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub phase: String,
    pub label: String,
    pub current: u64,
    pub total: u64,
    pub speed: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchState {
    pub phase: String,
    pub instance_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthPrompt {
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verification_uri: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountList {
    pub accounts: Vec<PublicAccount>,
    pub active_account_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapPayload {
    pub settings: AppSettings,
    pub accounts: Vec<PublicAccount>,
    pub active_account_id: Option<String>,
    pub instances: Vec<GameInstance>,
    pub versions: Vec<CatalogVersion>,
    pub launch: LaunchState,
    pub update: UpdateStateView,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStateView {
    pub phase: String,
    pub current_version: String,
    pub available_version: Option<String>,
    pub percent: u32,
    pub error: Option<String>,
}
