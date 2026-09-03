use crate::crypto::{decrypt_secret, encrypt_secret};
use crate::error::{Result, WoolyError};
use crate::json::{read_json_file, write_json_file};
use crate::model::{AccountList, PublicAccount};
use crate::paths::accounts_file;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBundle {
    pub ms_access_token: String,
    pub ms_refresh_token: String,
    #[serde(default)]
    pub msal_cache: Option<String>,
    pub ms_expires_at: u64,
    pub mc_access_token: String,
    pub mc_expires_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredAccount {
    id: String,
    username: String,
    #[serde(default)]
    xbox_gamertag: Option<String>,
    avatar_url: String,
    token_blob: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AccountStore {
    active_account_id: Option<String>,
    #[serde(default)]
    accounts: Vec<StoredAccount>,
}

static CACHE: Mutex<Option<AccountStore>> = Mutex::new(None);

fn to_public(account: &StoredAccount) -> PublicAccount {
    PublicAccount {
        id: account.id.clone(),
        username: account.username.clone(),
        xbox_gamertag: account.xbox_gamertag.clone(),
        avatar_url: account.avatar_url.clone(),
    }
}

async fn load() -> Result<AccountStore> {
    if let Some(cached) = CACHE.lock().ok().and_then(|g| g.clone()) {
        return Ok(cached);
    }
    let data = read_json_file(&accounts_file(), AccountStore::default()).await;
    if let Ok(mut guard) = CACHE.lock() {
        *guard = Some(data.clone());
    }
    Ok(data)
}

async fn persist(data: &AccountStore) -> Result<()> {
    write_json_file(&accounts_file(), data).await?;
    if let Ok(mut guard) = CACHE.lock() {
        *guard = Some(data.clone());
    }
    Ok(())
}

pub async fn list_public_accounts() -> Result<AccountList> {
    let data = load().await?;
    Ok(AccountList {
        active_account_id: data.active_account_id,
        accounts: data.accounts.iter().map(to_public).collect(),
    })
}

pub async fn get_active_account() -> Result<Option<PublicAccount>> {
    let data = load().await?;
    let id = data.active_account_id.clone();
    let found = if let Some(id) = id {
        data.accounts
            .iter()
            .find(|a| a.id == id)
            .or(data.accounts.first())
    } else {
        data.accounts.first()
    };
    Ok(found.map(to_public))
}

pub async fn upsert_account(account: PublicAccount, tokens: TokenBundle) -> Result<PublicAccount> {
    let mut data = load().await?;
    let stored = StoredAccount {
        id: account.id.clone(),
        username: account.username.clone(),
        xbox_gamertag: account.xbox_gamertag.clone(),
        avatar_url: account.avatar_url.clone(),
        token_blob: encrypt_secret(&serde_json::to_string(&tokens)?),
    };
    if let Some(existing) = data.accounts.iter_mut().find(|a| a.id == account.id) {
        *existing = stored;
    } else {
        data.accounts.insert(0, stored);
    }
    data.active_account_id = Some(account.id.clone());
    persist(&data).await?;
    Ok(account)
}

pub async fn read_tokens(id: &str) -> Result<TokenBundle> {
    let data = load().await?;
    let stored = data
        .accounts
        .iter()
        .find(|a| a.id == id)
        .ok_or_else(|| WoolyError::msg("Account not found."))?;
    let json = decrypt_secret(&stored.token_blob)?;
    Ok(serde_json::from_str(&json)?)
}

pub async fn select_account(id: &str) -> Result<()> {
    let mut data = load().await?;
    if !data.accounts.iter().any(|a| a.id == id) {
        return Err(WoolyError::msg("Account not found."));
    }
    data.active_account_id = Some(id.to_string());
    persist(&data).await
}

pub async fn remove_account(id: &str) -> Result<()> {
    let mut data = load().await?;
    data.accounts.retain(|a| a.id != id);
    if data.active_account_id.as_deref() == Some(id) {
        data.active_account_id = data.accounts.first().map(|a| a.id.clone());
    }
    persist(&data).await
}
