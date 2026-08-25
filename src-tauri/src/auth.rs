use crate::accounts::{read_tokens, upsert_account, TokenBundle};
use crate::error::{Result, WoolyError};
use crate::http::{json_error_message, post_json};
use crate::logic::{now_ms, owns_minecraft_java, MS_SCOPES};
use crate::model::{AuthPrompt, PublicAccount};
use crate::settings::load_settings;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use rand::Rng;
use reqwest::Client;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

const AUTHORIZE: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize";
const TOKEN: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
const DEVICE_CODE: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode";
const XBOX_USER: &str = "https://user.auth.xboxlive.com/user/authenticate";
const XBOX_XSTS: &str = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MC_LOGIN: &str = "https://api.minecraftservices.com/authentication/login_with_xbox";
const MC_ENTITLEMENTS: &str = "https://api.minecraftservices.com/entitlements/mcstore";
const MC_PROFILE: &str = "https://api.minecraftservices.com/minecraft/profile";

const SUCCESS_HTML: &str = "<html><body style=\"font-family:Inter,sans-serif;background:#161310;color:#f3ece3;display:grid;place-items:center;height:100vh\"><p>You can close this tab and return to Wooly.</p></body></html>";
const ERROR_HTML: &str = "<html><body style=\"font-family:Inter,sans-serif;background:#161310;color:#f3ece3;display:grid;place-items:center;height:100vh\"><p>Sign-in failed. Close this tab and try again in Wooly.</p></body></html>";

pub async fn login_microsoft(app: &AppHandle, http: &Client) -> Result<PublicAccount> {
    let client_id = load_settings().await?.microsoft_client_id;
    let emit_prompt = |prompt: Option<AuthPrompt>| {
        let _ = tauri::Emitter::emit(app, "wooly:event:auth", prompt);
    };

    emit_prompt(Some(AuthPrompt {
        kind: "browser".into(),
        user_code: None,
        verification_uri: None,
        message: "Complete sign-in in your browser. Wooly is waiting for Microsoft.".into(),
    }));

    let tokens = match tokio::time::timeout(
        Duration::from_secs(90),
        acquire_token_interactive(app, http, &client_id),
    )
    .await
    {
        Ok(Ok(tokens)) => tokens,
        Ok(Err(_)) | Err(_) => {
            acquire_token_device_code(app, http, &client_id, &emit_prompt).await?
        }
    };
    emit_prompt(None);

    let xbox = xbox_to_minecraft(http, &tokens.access_token).await?;
    let account = require_premium_profile(http, &xbox.mc_access_token, xbox.xbox_gamertag).await?;
    upsert_account(
        account.clone(),
        TokenBundle {
            ms_access_token: tokens.access_token,
            ms_refresh_token: tokens.refresh_token,
            msal_cache: None,
            ms_expires_at: tokens.expires_at,
            mc_access_token: xbox.mc_access_token,
            mc_expires_at: xbox.mc_expires_at,
        },
    )
    .await
}

struct MsTokens {
    access_token: String,
    refresh_token: String,
    expires_at: u64,
}

struct XboxMinecraft {
    mc_access_token: String,
    mc_expires_at: u64,
    xbox_gamertag: Option<String>,
}

fn pkce_pair() -> (String, String) {
    let bytes: [u8; 32] = rand::thread_rng().gen();
    let verifier = URL_SAFE_NO_PAD.encode(bytes);
    let digest = Sha256::digest(verifier.as_bytes());
    let challenge = URL_SAFE_NO_PAD.encode(digest);
    (verifier, challenge)
}

async fn acquire_token_interactive(
    app: &AppHandle,
    http: &Client,
    client_id: &str,
) -> Result<MsTokens> {
    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    let redirect = format!("http://localhost:{port}");
    let (verifier, challenge) = pkce_pair();
    let state = URL_SAFE_NO_PAD.encode(rand::thread_rng().gen::<[u8; 16]>());
    let url = format!(
        "{AUTHORIZE}?client_id={}&response_type=code&redirect_uri={}&scope={}&code_challenge={}&code_challenge_method=S256&state={}&prompt=select_account",
        urlencoding::encode(client_id),
        urlencoding::encode(&redirect),
        urlencoding::encode(MS_SCOPES),
        urlencoding::encode(&challenge),
        urlencoding::encode(&state),
    );
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| WoolyError::msg(e.to_string()))?;

    let (mut stream, _) = listener.accept().await?;
    let mut buf = vec![0u8; 8192];
    let n = stream.read(&mut buf).await?;
    let request = String::from_utf8_lossy(&buf[..n]).into_owned();
    let first = request.lines().next().unwrap_or_default();
    let path = first.split_whitespace().nth(1).unwrap_or("/");
    let query = path.split('?').nth(1).unwrap_or("");
    let params = parse_query(query);
    let html = if params.get("code").is_some() {
        SUCCESS_HTML
    } else {
        ERROR_HTML
    };
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{html}",
        html.len()
    );
    let _ = stream.write_all(response.as_bytes()).await;

    if let Some(error) = params.get("error") {
        return Err(WoolyError::msg(format!(
            "Microsoft sign-in failed ({error})."
        )));
    }
    if params.get("state").map(String::as_str) != Some(state.as_str()) {
        return Err(WoolyError::msg("Microsoft sign-in state did not match."));
    }
    let code = params
        .get("code")
        .cloned()
        .ok_or_else(|| WoolyError::msg("Microsoft sign-in did not return an access token."))?;
    exchange_code(http, client_id, &redirect, &code, &verifier).await
}

async fn exchange_code(
    http: &Client,
    client_id: &str,
    redirect: &str,
    code: &str,
    verifier: &str,
) -> Result<MsTokens> {
    let body = format!(
        "client_id={}&grant_type=authorization_code&code={}&redirect_uri={}&code_verifier={}&scope={}",
        urlencoding::encode(client_id),
        urlencoding::encode(code),
        urlencoding::encode(redirect),
        urlencoding::encode(verifier),
        urlencoding::encode(MS_SCOPES),
    );
    token_request(http, &body).await
}

async fn acquire_token_device_code(
    app: &AppHandle,
    http: &Client,
    client_id: &str,
    emit_prompt: &impl Fn(Option<AuthPrompt>),
) -> Result<MsTokens> {
    let body = format!(
        "client_id={}&scope={}",
        urlencoding::encode(client_id),
        urlencoding::encode(MS_SCOPES)
    );
    let response = http
        .post(DEVICE_CODE)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await?;
    let payload: Value = response.json().await?;
    let user_code = payload
        .get("user_code")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Microsoft device login did not start."))?;
    let verification_uri = payload
        .get("verification_uri")
        .or_else(|| payload.get("verification_uri_complete"))
        .and_then(Value::as_str)
        .unwrap_or("https://www.microsoft.com/link");
    let device_code = payload
        .get("device_code")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Microsoft device login did not start."))?;
    let interval = payload.get("interval").and_then(Value::as_u64).unwrap_or(5);
    let message = payload
        .get("message")
        .and_then(Value::as_str)
        .unwrap_or("Enter this code on the Microsoft page.");

    emit_prompt(Some(AuthPrompt {
        kind: "device_code".into(),
        user_code: Some(user_code.into()),
        verification_uri: Some(verification_uri.into()),
        message: message.into(),
    }));
    let _ = app.opener().open_url(verification_uri, None::<&str>);

    let token_body = format!(
        "grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id={}&device_code={}",
        urlencoding::encode(client_id),
        urlencoding::encode(device_code)
    );
    for _ in 0..60 {
        tokio::time::sleep(Duration::from_secs(interval.max(1))).await;
        match token_request(http, &token_body).await {
            Ok(tokens) => return Ok(tokens),
            Err(error) => {
                let text = error.0.to_lowercase();
                if text.contains("authorization_pending") || text.contains("slow_down") {
                    continue;
                }
                return Err(error);
            }
        }
    }
    Err(WoolyError::msg("Microsoft sign-in timed out."))
}

async fn token_request(http: &Client, body: &str) -> Result<MsTokens> {
    let response = http
        .post(TOKEN)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body.to_string())
        .send()
        .await?;
    let status = response.status();
    let payload: Value = response.json().await.unwrap_or(json!({}));
    if !status.is_success() {
        return Err(WoolyError::msg(json_error_message(status.as_u16(), &payload)));
    }
    let access = payload
        .get("access_token")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Microsoft sign-in did not return an access token."))?;
    let refresh = payload
        .get("refresh_token")
        .and_then(Value::as_str)
        .unwrap_or("");
    let expires = payload.get("expires_in").and_then(Value::as_u64).unwrap_or(3600);
    Ok(MsTokens {
        access_token: access.into(),
        refresh_token: refresh.into(),
        expires_at: now_ms() + expires.saturating_sub(60) * 1000,
    })
}

async fn xbox_to_minecraft(http: &Client, ms_access: &str) -> Result<XboxMinecraft> {
    let rps = if ms_access.starts_with("d=") {
        ms_access.to_string()
    } else {
        format!("d={ms_access}")
    };
    let (status, xbox) = post_json(
        http,
        XBOX_USER,
        &json!({
            "Properties": {
                "AuthMethod": "RPS",
                "SiteName": "user.auth.xboxlive.com",
                "RpsTicket": rps
            },
            "RelyingParty": "http://auth.xboxlive.com",
            "TokenType": "JWT"
        }),
    )
    .await?;
    if status >= 400 {
        return Err(WoolyError::msg(json_error_message(status, &xbox)));
    }
    let xbox_token = xbox
        .pointer("/Token")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Xbox login did not return a token."))?;
    let gamertag = xbox
        .pointer("/DisplayClaims/xui/0/gtg")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned);

    let (status, xsts) = post_json(
        http,
        XBOX_XSTS,
        &json!({
            "Properties": {
                "SandboxId": "RETAIL",
                "UserTokens": [xbox_token]
            },
            "RelyingParty": "rp://api.minecraftservices.com/",
            "TokenType": "JWT"
        }),
    )
    .await?;
    if status >= 400 {
        return Err(WoolyError::msg(json_error_message(status, &xsts)));
    }
    let xsts_token = xsts
        .pointer("/Token")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Xbox login did not return a token."))?;
    let uhs = xsts
        .pointer("/DisplayClaims/xui/0/uhs")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Xbox login did not return a user hash."))?;

    let (status, mc) = post_json(
        http,
        MC_LOGIN,
        &json!({ "identityToken": format!("XBL3.0 x={uhs};{xsts_token}") }),
    )
    .await?;
    if status >= 400 {
        return Err(WoolyError::msg(json_error_message(status, &mc)));
    }
    let access = mc
        .get("access_token")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Minecraft login did not return an access token."))?;
    let expires = mc.get("expires_in").and_then(Value::as_u64).unwrap_or(86400);
    Ok(XboxMinecraft {
        mc_access_token: access.into(),
        mc_expires_at: now_ms() + expires.saturating_sub(60) * 1000,
        xbox_gamertag: gamertag,
    })
}

async fn require_premium_profile(
    http: &Client,
    mc_access: &str,
    xbox_gamertag: Option<String>,
) -> Result<PublicAccount> {
    let entitlements: Value = authorized_get(http, MC_ENTITLEMENTS, mc_access).await?;
    let names = entitlements
        .get("items")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.get("name").and_then(Value::as_str).map(ToOwned::to_owned))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    if !owns_minecraft_java(&names) {
        return Err(WoolyError::msg(
            "This Microsoft account does not own Minecraft Java Edition. Wooly only launches premium accounts.",
        ));
    }
    let profile: Value = authorized_get(http, MC_PROFILE, mc_access).await?;
    let id = profile
        .get("id")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Minecraft Java is owned, but no profile was returned. Open minecraft.net once, then try again."))?;
    let name = profile
        .get("name")
        .and_then(Value::as_str)
        .ok_or_else(|| WoolyError::msg("Minecraft Java is owned, but no profile was returned. Open minecraft.net once, then try again."))?;
    Ok(PublicAccount {
        id: id.into(),
        username: name.into(),
        xbox_gamertag,
        avatar_url: format!("https://mc-heads.net/avatar/{id}/64"),
    })
}

async fn authorized_get(http: &Client, url: &str, token: &str) -> Result<Value> {
    let response = http
        .get(url)
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await?;
    let status = response.status();
    let payload: Value = response.json().await.unwrap_or(json!({}));
    if !status.is_success() {
        return Err(WoolyError::msg(json_error_message(status.as_u16(), &payload)));
    }
    Ok(payload)
}

async fn refresh_microsoft_token(http: &Client, client_id: &str, refresh: &str) -> Result<MsTokens> {
    let body = format!(
        "client_id={}&refresh_token={}&grant_type=refresh_token&scope={}",
        urlencoding::encode(client_id),
        urlencoding::encode(refresh),
        urlencoding::encode(MS_SCOPES)
    );
    token_request(http, &body)
        .await
        .map_err(|_| WoolyError::msg("This Microsoft session expired. Sign in again from the account menu."))
}

fn refresh_from_msal_cache(serialized: Option<&str>) -> Option<String> {
    let raw = serialized?;
    let parsed: Value = serde_json::from_str(raw).ok()?;
    parsed
        .get("RefreshToken")?
        .as_object()?
        .values()
        .next()?
        .get("secret")?
        .as_str()
        .map(ToOwned::to_owned)
}

pub async fn silent_minecraft_token(http: &Client, account_id: &str) -> Result<String> {
    let tokens = read_tokens(account_id).await?;
    if !tokens.mc_access_token.is_empty() && tokens.mc_expires_at > now_ms() + 15_000 {
        return Ok(tokens.mc_access_token);
    }
    let client_id = load_settings().await?.microsoft_client_id;
    let refresh = if !tokens.ms_refresh_token.is_empty() {
        tokens.ms_refresh_token.clone()
    } else {
        refresh_from_msal_cache(tokens.msal_cache.as_deref()).unwrap_or_default()
    };
    if refresh.is_empty() {
        return Err(WoolyError::msg(
            "This Microsoft session expired. Sign in again from the account menu.",
        ));
    }
    let refreshed = refresh_microsoft_token(http, &client_id, &refresh).await?;
    let xbox = xbox_to_minecraft(http, &refreshed.access_token).await?;
    let profile = require_premium_profile(http, &xbox.mc_access_token, xbox.xbox_gamertag).await?;
    upsert_account(
        profile,
        TokenBundle {
            ms_access_token: refreshed.access_token,
            ms_refresh_token: refreshed.refresh_token,
            msal_cache: tokens.msal_cache,
            ms_expires_at: refreshed.expires_at,
            mc_access_token: xbox.mc_access_token.clone(),
            mc_expires_at: xbox.mc_expires_at,
        },
    )
    .await?;
    Ok(xbox.mc_access_token)
}

fn parse_query(query: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        let mut parts = pair.splitn(2, '=');
        let key = parts.next().unwrap_or_default();
        let value = parts.next().unwrap_or_default();
        map.insert(
            urlencoding::decode(key).unwrap_or_default().into_owned(),
            urlencoding::decode(value).unwrap_or_default().into_owned(),
        );
    }
    map
}
