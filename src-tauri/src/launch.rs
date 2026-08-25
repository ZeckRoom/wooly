use crate::accounts::{get_active_account, read_tokens};
use crate::error::{Result, WoolyError};
use crate::logic::{classpath_separator, now_ms};
use crate::model::{GameInstance, LogLine};
use crate::paths::{assets_dir, instance_game_dir, libraries_dir};
use crate::version::{
    classpath_jars, collect_args, extract_natives, feature_map, interpolate, logging_file,
    ResolvedVersion,
};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

pub struct GameProcess {
    pub child: Child,
    pub instance_id: String,
}

pub type GameSlot = Mutex<Option<GameProcess>>;

static LOG_SEQ: AtomicU64 = AtomicU64::new(0);

pub fn next_log(stream: &str, text: impl Into<String>) -> LogLine {
    LogLine {
        id: LOG_SEQ.fetch_add(1, Ordering::Relaxed) + 1,
        ts: now_ms(),
        stream: stream.into(),
        text: text.into(),
    }
}

pub fn emit_log(app: &AppHandle, stream: &str, text: impl Into<String>) {
    let _ = app.emit("wooly:event:logs", next_log(stream, text));
}

pub async fn is_game_running(slot: &GameSlot) -> bool {
    slot.lock().await.is_some()
}

pub async fn stop_game(slot: &GameSlot) -> Result<()> {
    if let Some(mut current) = slot.lock().await.take() {
        let _ = current.child.kill().await;
    }
    Ok(())
}

pub async fn play_instance(
    app: AppHandle,
    http: &reqwest::Client,
    slot: &GameSlot,
    instance: &GameInstance,
    resolved: &ResolvedVersion,
    java_path: &str,
) -> Result<()> {
    if is_game_running(slot).await {
        return Err(WoolyError::msg("Minecraft is already running."));
    }
    let account = get_active_account()
        .await?
        .ok_or_else(|| WoolyError::msg("Sign in with a premium Microsoft account before playing."))?;
    let access_token = crate::auth::silent_minecraft_token(http, &account.id).await?;
    let _ = read_tokens(&account.id).await;

    let natives = extract_natives(resolved)?;
    let game_dir = instance_game_dir(&instance.id);
    tokio::fs::create_dir_all(&game_dir).await?;

    let classpath = classpath_jars(resolved)?
        .into_iter()
        .map(|p| p.to_string_lossy().into_owned())
        .collect::<Vec<_>>()
        .join(classpath_separator());

    let features = feature_map(true);
    let mut vars: HashMap<&str, String> = HashMap::new();
    vars.insert("auth_player_name", account.username.clone());
    vars.insert("version_name", instance.version_id.clone());
    vars.insert("game_directory", game_dir.to_string_lossy().into_owned());
    vars.insert("assets_root", assets_dir().to_string_lossy().into_owned());
    vars.insert("game_assets", assets_dir().to_string_lossy().into_owned());
    vars.insert(
        "assets_index_name",
        resolved
            .asset_index
            .as_ref()
            .map(|i| i.id.clone())
            .or_else(|| resolved.assets.clone())
            .unwrap_or_else(|| "legacy".into()),
    );
    vars.insert("auth_uuid", account.id.clone());
    vars.insert("auth_access_token", access_token.clone());
    vars.insert("auth_session", access_token);
    vars.insert("clientid", crate::logic::WOOLY_MS_CLIENT_ID.to_string());
    vars.insert("auth_xuid", String::new());
    vars.insert("user_type", "msa".into());
    vars.insert("version_type", instance.version_type.clone());
    vars.insert("resolution_width", instance.width.to_string());
    vars.insert("resolution_height", instance.height.to_string());
    vars.insert("natives_directory", natives.to_string_lossy().into_owned());
    vars.insert("launcher_name", "wooly".into());
    vars.insert("launcher_version", env!("CARGO_PKG_VERSION").into());
    vars.insert("classpath", classpath.clone());
    vars.insert(
        "library_directory",
        libraries_dir().to_string_lossy().into_owned(),
    );
    vars.insert("classpath_separator", classpath_separator().into());
    vars.insert("user_properties", "{}".into());
    if let Some(logging) = logging_file(resolved) {
        vars.insert("path", logging.path.to_string_lossy().into_owned());
    }

    let mut jvm = vec![
        format!("-Xms{}M", instance.memory_min_mb),
        format!("-Xmx{}M", instance.memory_max_mb),
    ];
    jvm.extend(instance.jvm_args.split_whitespace().map(ToOwned::to_owned));

    if let Some(arguments) = &resolved.arguments {
        jvm.extend(
            collect_args(&arguments.jvm, &features)
                .into_iter()
                .map(|arg| interpolate(&arg, &vars)),
        );
    } else {
        jvm.push(format!(
            "-Djava.library.path={}",
            natives.to_string_lossy()
        ));
        jvm.push("-cp".into());
        jvm.push(classpath);
    }

    if let Some(logging) = resolved.logging.as_ref().and_then(|l| l.client.as_ref()) {
        if let Some(argument) = &logging.argument {
            if !jvm.iter().any(|item| item.contains("log4j.configurationFile")) {
                jvm.push(interpolate(argument, &vars));
            }
        }
    }

    let mut game = if let Some(arguments) = &resolved.arguments {
        collect_args(&arguments.game, &features)
            .into_iter()
            .map(|arg| interpolate(&arg, &vars))
            .collect::<Vec<_>>()
    } else if let Some(legacy) = &resolved.minecraft_arguments {
        legacy
            .split_whitespace()
            .map(|arg| interpolate(arg, &vars))
            .collect::<Vec<_>>()
    } else {
        Vec::new()
    };

    if instance.fullscreen && !game.iter().any(|a| a == "--fullscreen") {
        game.push("--fullscreen".into());
    }

    emit_log(
        &app,
        "launcher",
        format!("Launching {} as {}", instance.version_id, account.username),
    );

    let mut command = Command::new(java_path);
    command
        .current_dir(&game_dir)
        .args(&jvm)
        .arg(&resolved.main_class)
        .args(&game)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = command.spawn()?;
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    if let Some(out) = stdout {
        let app_out = app.clone();
        tokio::spawn(async move {
            let mut lines = BufReader::new(out).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                emit_log(&app_out, "stdout", line);
            }
        });
    }
    if let Some(err) = stderr {
        let app_err = app.clone();
        tokio::spawn(async move {
            let mut lines = BufReader::new(err).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                emit_log(&app_err, "stderr", line);
            }
        });
    }

    {
        let mut guard = slot.lock().await;
        *guard = Some(GameProcess {
            child,
            instance_id: instance.id.clone(),
        });
    }

    Ok(())
}

pub async fn watch_game_exit(app: AppHandle, slot: std::sync::Arc<GameSlot>) {
    loop {
        tokio::time::sleep(Duration::from_millis(400)).await;
        let mut guard = slot.lock().await;
        let Some(proc) = guard.as_mut() else {
            break;
        };
        match proc.child.try_wait() {
            Ok(Some(status)) => {
                let code = status.code();
                *guard = None;
                drop(guard);
                emit_log(
                    &app,
                    "launcher",
                    format!("Minecraft exited ({})", code.map(|c| c.to_string()).unwrap_or_else(|| "null".into())),
                );
                let _ = app.emit(
                    "wooly:event:launch",
                    crate::model::LaunchState {
                        phase: "idle".into(),
                        instance_id: None,
                        error: None,
                    },
                );
                break;
            }
            Ok(None) => {}
            Err(error) => {
                *guard = None;
                drop(guard);
                emit_log(&app, "launcher", format!("Minecraft exited ({error})"));
                let _ = app.emit(
                    "wooly:event:launch",
                    crate::model::LaunchState {
                        phase: "idle".into(),
                        instance_id: None,
                        error: None,
                    },
                );
                break;
            }
        }
    }
}
