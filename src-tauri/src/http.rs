use crate::error::{Result, WoolyError};
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde_json::Value;

pub fn client() -> Client {
    Client::builder()
        .user_agent(format!("Wooly-Launcher/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .expect("http client")
}

pub async fn get_json<T: DeserializeOwned>(http: &Client, url: &str) -> Result<T> {
    let response = http.get(url).send().await?;
    let status = response.status();
    let text = response.text().await?;
    if !status.is_success() {
        return Err(WoolyError::msg(format!("Request failed ({status})")));
    }
    Ok(serde_json::from_str(&text)?)
}

pub async fn post_json(http: &Client, url: &str, body: &Value) -> Result<(u16, Value)> {
    let response = http
        .post(url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(body)
        .send()
        .await?;
    let status = response.status().as_u16();
    let text = response.text().await.unwrap_or_else(|_| "{}".into());
    let value = serde_json::from_str(&text).unwrap_or(Value::Object(Default::default()));
    Ok((status, value))
}

pub fn json_error_message(status: u16, body: &Value) -> String {
    if let Some(xerr) = body.get("XErr") {
        let code = xerr.to_string().replace('"', "");
        if let Some(mapped) = crate::logic::xbox_error_message(Some(&code)) {
            return mapped.to_string();
        }
    }
    body.get("errorMessage")
        .or_else(|| body.get("error_description"))
        .or_else(|| body.get("error"))
        .and_then(|v| v.as_str())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| format!("Request failed ({status})"))
}
