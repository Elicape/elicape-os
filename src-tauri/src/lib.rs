use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::io::{BufRead, BufReader};
use tauri::{State, AppHandle, Emitter};

mod wezterm;

struct ServerState(Mutex<Option<Child>>);

#[tauri::command]
async fn start_server(
    binary_path: String,
    args: Vec<String>,
    state: State<'_, ServerState>,
    app: AppHandle,
) -> Result<u32, String> {
    let mut lock = state.0.lock().map_err(|_| "Failed to lock server state")?;
    
    // Stop existing server if any
    if let Some(mut child) = lock.take() {
        let _ = child.kill();
    }

    let mut child = Command::new(binary_path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn server: {}", e))?;

    let pid = child.id();
    
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    // Spawn threads to pipe logs to frontend
    let app_stdout = app.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = app_stdout.emit("server-log", l);
            }
        }
    });

    let app_stderr = app.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = app_stderr.emit("server-log", l);
            }
        }
    });

    *lock = Some(child);
    
    Ok(pid)
}

#[tauri::command]
async fn stop_server(state: State<'_, ServerState>) -> Result<(), String> {
    let mut lock = state.0.lock().map_err(|_| "Failed to lock server state")?;
    if let Some(mut child) = lock.take() {
        child.kill().map_err(|e| format!("Failed to kill server: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
async fn run_shell_command(command: String) -> Result<String, String> {
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", &command])
            .output()
    } else {
        Command::new("sh")
            .arg("-c")
            .arg(&command)
            .output()
    };

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            if output.status.success() {
                Ok(if stdout.is_empty() { "Command executed successfully (no output)".to_string() } else { stdout })
            } else {
                Err(format!("Command failed:\nStderr:\n{}\nStdout:\n{}", stderr, stdout))
            }
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}

#[tauri::command]
fn test_fs_real() -> Result<String, String> {
    use std::fs;
    match fs::write("/tmp/ELICAPE_VIVO.txt", "FS REAL OK - TAURI HEADLESS - 2026-07-07") {
        Ok(_) => Ok("Archivo creado: /tmp/ELICAPE_VIVO.txt".into()),
        Err(e) => Err(format!("Error: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ServerState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![start_server, stop_server, run_shell_command, test_fs_real, wezterm::launch_wezterm_cage])
        .setup(|_app| {
            let _ = test_fs_real();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
