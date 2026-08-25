pub const WOOLY_MS_CLIENT_ID: &str = "f8e1ccbe-2013-423b-8eb9-f864385b46a6";
pub const MS_SCOPES: &str = "XboxLive.signin offline_access";
pub const VERSION_MANIFEST: &str = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
pub const JAVA_RUNTIME_ALL: &str =
    "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";
pub const GITHUB_REPO: &str = "ZeckRoom/wooly";

pub const NAME_MAX: usize = 32;
pub const MEMORY_MIN: u32 = 512;
pub const MEMORY_MAX: u32 = 32768;
pub const DEFAULT_MEMORY_MAX: u32 = 4096;
pub const DEFAULT_MEMORY_MIN: u32 = 512;

pub fn resolve_ms_client_id(stored: Option<&str>, env: Option<&str>) -> String {
    if let Some(value) = env.map(str::trim).filter(|s| !s.is_empty()) {
        return value.to_string();
    }
    if let Some(value) = stored.map(str::trim).filter(|s| !s.is_empty()) {
        return value.to_string();
    }
    WOOLY_MS_CLIENT_ID.to_string()
}

pub fn normalize_instance_name(name: &str) -> String {
    name.trim().split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn valid_instance_name(name: &str) -> bool {
    !name.is_empty()
        && name.chars().count() <= NAME_MAX
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || " _.'-".contains(c))
}

pub fn validate_instance(
    name: &str,
    group: &str,
    version_id: &str,
    memory_min: u32,
    memory_max: u32,
    existing_names: &[String],
    current_name: Option<&str>,
) -> Result<(), String> {
    let name = normalize_instance_name(name);
    if name.chars().count() < 1 || name.chars().count() > NAME_MAX {
        return Err(format!(
            "Name must be between 1 and {NAME_MAX} characters."
        ));
    }
    if !valid_instance_name(&name) {
        return Err("Name can only contain letters, numbers, spaces, and _ . ' -".into());
    }
    let taken: Vec<String> = existing_names
        .iter()
        .map(|n| n.trim().to_lowercase())
        .filter(|n| current_name.map(|c| n != &c.trim().to_lowercase()).unwrap_or(true))
        .collect();
    if taken.contains(&name.to_lowercase()) {
        return Err("An instance with this name already exists.".into());
    }
    if version_id.trim().is_empty() {
        return Err("Pick a Minecraft version.".into());
    }
    if group != "vanilla" && group != "modded" {
        return Err("Pick Vanilla or Modded.".into());
    }
    if !(MEMORY_MIN..=MEMORY_MAX).contains(&memory_max) {
        return Err(format!(
            "Max memory must be between {MEMORY_MIN} and {MEMORY_MAX} MB."
        ));
    }
    if memory_min < MEMORY_MIN || memory_min > memory_max {
        return Err("Min memory must be at least 512 MB and not greater than max memory.".into());
    }
    Ok(())
}

pub fn version_channel_of(kind: &str) -> &'static str {
    if kind == "snapshot" {
        "snapshot"
    } else {
        "release"
    }
}

pub fn is_supported_channel(kind: &str) -> bool {
    kind == "release" || kind == "snapshot"
}

pub fn java_runtime_for(component: Option<&str>, major: Option<u32>) -> String {
    if let Some(name) = component.map(str::trim).filter(|s| !s.is_empty()) {
        return name.to_string();
    }
    let major = major.unwrap_or(8);
    if major >= 21 {
        "java-runtime-delta".into()
    } else if major >= 17 {
        "java-runtime-gamma".into()
    } else if major >= 16 {
        "java-runtime-beta".into()
    } else if major >= 11 {
        "java-runtime-alpha".into()
    } else {
        "jre-legacy".into()
    }
}

pub fn java_executable_name() -> &'static str {
    if cfg!(windows) {
        "javaw.exe"
    } else {
        "java"
    }
}

pub fn owns_minecraft_java(items: &[String]) -> bool {
    items
        .iter()
        .any(|name| name == "game_minecraft" || name == "product_minecraft")
}

pub fn xbox_error_message(xerr: Option<&str>) -> Option<&'static str> {
    match xerr.unwrap_or("") {
        "2148916233" => {
            Some("This Microsoft account has no Xbox profile. Create one at xbox.com, then try again.")
        }
        "2148916238" => {
            Some("This Microsoft account is a child account. An adult must add it to a family.")
        }
        "2148916235" => Some("Xbox Live is not available in this region for that account."),
        _ => None,
    }
}

pub fn parse_launcher_version(version: &str) -> Vec<u32> {
    let core = version.split('+').next().unwrap_or(version).trim();
    core.split(|c: char| c == '.' || c == '-')
        .map(|part| part.parse::<u32>().unwrap_or(0))
        .collect()
}

pub fn compare_launcher_versions(left: &str, right: &str) -> i32 {
    let a = parse_launcher_version(left);
    let b = parse_launcher_version(right);
    let len = a.len().max(b.len());
    for i in 0..len {
        let da = a.get(i).copied().unwrap_or(0);
        let db = b.get(i).copied().unwrap_or(0);
        if da > db {
            return 1;
        }
        if da < db {
            return -1;
        }
    }
    0
}

pub fn is_launcher_update(current: &str, available: &str) -> bool {
    compare_launcher_versions(available, current) > 0
}

pub fn update_download_percent(transferred: u64, total: u64) -> u32 {
    if total == 0 {
        return 0;
    }
    ((transferred * 100) / total).min(100) as u32
}

pub fn update_feed_error_message(text: &str) -> String {
    if text.to_lowercase().contains("404") || text.to_lowercase().contains("not found") {
        "Could not read GitHub Releases. The wooly repository must be public for in-app updates."
            .into()
    } else if text.trim().is_empty() {
        "Could not check for updates.".into()
    } else {
        text.trim().to_string()
    }
}

pub fn classpath_separator() -> &'static str {
    if cfg!(windows) { ";" } else { ":" }
}

pub fn os_name() -> &'static str {
    if cfg!(windows) {
        "windows"
    } else if cfg!(target_os = "macos") {
        "osx"
    } else {
        "linux"
    }
}

pub fn os_arch() -> &'static str {
    if cfg!(target_arch = "aarch64") {
        "arm64"
    } else if cfg!(target_arch = "x86") {
        "x86"
    } else {
        "x86_64"
    }
}

pub fn natives_arch_token() -> &'static str {
    if cfg!(target_pointer_width = "32") {
        "32"
    } else {
        "64"
    }
}

pub fn java_platform_key() -> &'static str {
    match (os_name(), os_arch()) {
        ("windows", "arm64") => "windows-arm64",
        ("windows", "x86") => "windows-x86",
        ("windows", _) => "windows-x64",
        ("osx", "arm64") => "mac-os-arm64",
        ("osx", _) => "mac-os",
        ("linux", "x86") => "linux-i386",
        _ => "linux",
    }
}

pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn premium_entitlements() {
        assert!(owns_minecraft_java(&["product_minecraft".into(), "game_minecraft".into()]));
        assert!(owns_minecraft_java(&["game_minecraft".into()]));
        assert!(!owns_minecraft_java(&["product_minecraft_bedrock".into()]));
        assert!(!owns_minecraft_java(&[]));
    }

    #[test]
    fn xbox_codes() {
        assert!(xbox_error_message(Some("2148916233"))
            .unwrap()
            .contains("Xbox profile"));
        assert!(xbox_error_message(Some("2148916238")).unwrap().contains("child"));
        assert!(xbox_error_message(Some("nope")).is_none());
    }

    #[test]
    fn java_mapping() {
        assert_eq!(
            java_runtime_for(Some("java-runtime-delta"), Some(8)),
            "java-runtime-delta"
        );
        assert_eq!(java_runtime_for(None, Some(21)), "java-runtime-delta");
        assert_eq!(java_runtime_for(None, Some(17)), "java-runtime-gamma");
        assert_eq!(java_runtime_for(None, None), "jre-legacy");
    }

    #[test]
    fn versions() {
        assert!(is_launcher_update("0.1.0", "0.1.16"));
        assert!(!is_launcher_update("0.1.16", "0.1.16"));
        assert!(!is_launcher_update("0.1.16", "0.1.2"));
        assert_eq!(update_download_percent(50, 100), 50);
        assert_eq!(update_download_percent(0, 0), 0);
        assert!(update_feed_error_message("HttpError: 404 Not Found").contains("public"));
    }

    #[test]
    fn client_id() {
        assert_eq!(resolve_ms_client_id(None, None), WOOLY_MS_CLIENT_ID);
        assert_eq!(
            resolve_ms_client_id(Some("  "), Some("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")),
            "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        );
    }

    #[test]
    fn instance_names() {
        assert!(validate_instance(
            "Survival",
            "vanilla",
            "1.21.4",
            512,
            4096,
            &[],
            None
        )
        .is_ok());
        assert!(validate_instance("Pack", "modded", "", 512, 4096, &["pack".into()], None).is_err());
    }
}
