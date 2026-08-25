use crate::error::{Result, WoolyError};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;

pub fn encrypt_secret(value: &str) -> String {
    match dpapi_protect(value.as_bytes()) {
        Ok(bytes) => format!("enc:{}", STANDARD.encode(bytes)),
        Err(_) => format!("plain:{}", STANDARD.encode(value.as_bytes())),
    }
}

pub fn decrypt_secret(value: &str) -> Result<String> {
    if let Some(rest) = value.strip_prefix("enc:") {
        let bytes = STANDARD
            .decode(rest)
            .map_err(|_| WoolyError::msg("Stored account session is not readable."))?;
        let plain = dpapi_unprotect(&bytes)?;
        String::from_utf8(plain)
            .map_err(|_| WoolyError::msg("Stored account session is not readable."))
    } else if let Some(rest) = value.strip_prefix("plain:") {
        let bytes = STANDARD
            .decode(rest)
            .map_err(|_| WoolyError::msg("Stored account session is not readable."))?;
        String::from_utf8(bytes)
            .map_err(|_| WoolyError::msg("Stored account session is not readable."))
    } else {
        Ok(value.to_string())
    }
}

#[cfg(windows)]
fn dpapi_protect(data: &[u8]) -> Result<Vec<u8>> {
    win::protect(data)
}

#[cfg(windows)]
fn dpapi_unprotect(data: &[u8]) -> Result<Vec<u8>> {
    win::unprotect(data)
}

#[cfg(not(windows))]
fn dpapi_protect(_data: &[u8]) -> Result<Vec<u8>> {
    Err(WoolyError::msg("DPAPI is only available on Windows."))
}

#[cfg(not(windows))]
fn dpapi_unprotect(_data: &[u8]) -> Result<Vec<u8>> {
    Err(WoolyError::msg(
        "This account was encrypted on Windows. Sign in again from the account menu.",
    ))
}

#[cfg(windows)]
mod win {
    use crate::error::{Result, WoolyError};
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Cryptography::{
        CryptProtectData, CryptUnprotectData, CRYPT_INTEGER_BLOB, CRYPTPROTECT_UI_FORBIDDEN,
    };

    pub fn protect(data: &[u8]) -> Result<Vec<u8>> {
        crypt(data, true)
    }

    pub fn unprotect(data: &[u8]) -> Result<Vec<u8>> {
        crypt(data, false)
    }

    fn crypt(data: &[u8], encrypt: bool) -> Result<Vec<u8>> {
        let mut input = CRYPT_INTEGER_BLOB {
            cbData: data.len() as u32,
            pbData: data.as_ptr() as *mut u8,
        };
        let mut output = CRYPT_INTEGER_BLOB {
            cbData: 0,
            pbData: std::ptr::null_mut(),
        };
        let ok = unsafe {
            if encrypt {
                CryptProtectData(
                    &mut input,
                    std::ptr::null(),
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                    CRYPTPROTECT_UI_FORBIDDEN,
                    &mut output,
                )
            } else {
                CryptUnprotectData(
                    &mut input,
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                    CRYPTPROTECT_UI_FORBIDDEN,
                    &mut output,
                )
            }
        };
        if ok == 0 {
            return Err(WoolyError::msg(
                "Windows could not read the saved Microsoft session. Sign in again.",
            ));
        }
        let bytes = unsafe {
            std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec()
        };
        unsafe {
            LocalFree(output.pbData as _);
        }
        Ok(bytes)
    }
}
