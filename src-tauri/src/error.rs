use serde::Serialize;
use std::fmt;

pub type Result<T> = std::result::Result<T, WoolyError>;

#[derive(Debug)]
pub struct WoolyError(pub String);

impl WoolyError {
    pub fn msg(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl fmt::Display for WoolyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for WoolyError {}

impl Serialize for WoolyError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.0)
    }
}

impl From<std::io::Error> for WoolyError {
    fn from(value: std::io::Error) -> Self {
        Self(value.to_string())
    }
}

impl From<serde_json::Error> for WoolyError {
    fn from(value: serde_json::Error) -> Self {
        Self(value.to_string())
    }
}

impl From<reqwest::Error> for WoolyError {
    fn from(value: reqwest::Error) -> Self {
        Self(value.to_string())
    }
}

impl From<zip::result::ZipError> for WoolyError {
    fn from(value: zip::result::ZipError) -> Self {
        Self(value.to_string())
    }
}

impl From<uuid::Error> for WoolyError {
    fn from(value: uuid::Error) -> Self {
        Self(value.to_string())
    }
}
