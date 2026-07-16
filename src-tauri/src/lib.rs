use std::process::{Child, Command, Stdio};
use std::sync::{Mutex, Arc};
use std::io::{BufRead, BufReader};
use tauri::{AppHandle, State, Emitter, Manager};
use std::fs;

mod wezterm;
mod config_watcher;
mod constants;

use constants::{APP_NAME, APP_DIR, app_tmp_dir};

struct ServerState(Mutex<Option<Child>>);

struct LlamaState(Mutex<Option<Child>>);

#[tauri::command]
async fn start_server(
    binary_path: String,
    args: Vec<String>,
    state: State<'_, ServerState>,
    app: AppHandle,
) -> Result<u32, String> {
    let mut lock = state.0.lock().map_err(|_| "Failed to lock server state")?;

    if let Some(mut child) = lock.take() {
        let _ = child.kill();
    }

    let mut child = Command::new(&binary_path)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn server: {}", e))?;

    let pid = child.id();

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

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
    let test_path = app_tmp_dir().join("VIVO.txt");
    if let Some(parent) = test_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    match fs::write(&test_path, format!("FS REAL OK - TAURI - 2026-07-09")) {
        Ok(_) => Ok(format!("Archivo creado: {}", test_path.display())),
        Err(e) => Err(format!("Error: {}", e))
    }
}

#[tauri::command]
fn test_fs_write() -> Result<String, String> {
    let test_path = app_tmp_dir().join("test_write");
    if let Some(parent) = test_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    fs::write(&test_path, "integrity").map_err(|e| format!("FS write failed: {}", e))?;
    let _ = fs::remove_file(&test_path);
    Ok(format!("OK: {}", test_path.display()))
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    std::env::var("HOME").map_err(|_| "HOME not set".to_string())
}

#[tauri::command]
fn get_project_root() -> Result<String, String> {
    let cwd = std::env::current_dir().map_err(|e| format!("Cannot determine cwd: {}", e))?;
    if let Ok(root) = std::env::var("PROJECT_ROOT") {
        if let Ok(canonical) = std::fs::canonicalize(&root) {
            return Ok(canonical.to_string_lossy().to_string());
        }
        return Ok(root);
    }
    Ok(cwd.to_string_lossy().to_string())
}

fn get_project_root_path() -> Result<std::path::PathBuf, String> {
    if let Ok(project_root) = std::env::var("PROJECT_ROOT") {
        if let Ok(canonical) = std::fs::canonicalize(&project_root) {
            Ok(canonical)
        } else {
            Ok(std::path::PathBuf::from(&project_root))
        }
    } else {
        std::env::current_dir().map_err(|e| format!("Cannot determine cwd: {}", e))
    }
}

fn app_dir_path(root: &std::path::Path) -> std::path::PathBuf {
    root.join(APP_DIR)
}

#[tauri::command]
fn save_active_repo(path: String, app: AppHandle) -> Result<(), String> {
    let root = get_project_root_path()?;
    let repo_path = app_dir_path(&root).join("active.repo");
    if let Some(parent) = repo_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Error creating dir: {}", e))?;
    }
    fs::write(&repo_path, &path).map_err(|e| format!("Error writing active.repo: {}", e))?;
    println!("[{}] active.repo guardado: {}", APP_NAME, repo_path.display());
    let _ = app.emit("repo-changed", path);
    Ok(())
}

#[tauri::command]
fn get_active_repo() -> Result<Option<String>, String> {
    let root = get_project_root_path()?;
    let repo_path = app_dir_path(&root).join("active.repo");
    match fs::read_to_string(&repo_path) {
        Ok(content) => {
            let trimmed = content.trim().to_string();
            if trimmed.is_empty() {
                Ok(None)
            } else {
                Ok(Some(trimmed))
            }
        }
        Err(_) => Ok(None),
    }
}

fn auto_create_active_repo(root: &std::path::Path) {
    let repo_path = app_dir_path(root).join("active.repo");
    if !repo_path.exists() {
        let _ = fs::write(&repo_path, root.to_string_lossy().as_ref());
        println!("[{}] active.repo auto-creado en {}", APP_NAME, repo_path.display());
    }
}

#[tauri::command]
async fn check_llama_server() -> bool {
    tokio::net::TcpStream::connect("127.0.0.1:8080").await.is_ok()
}

#[tauri::command]
async fn start_llama_server(app: AppHandle, state: State<'_, LlamaState>) -> Result<String, String> {
    if check_llama_server().await {
        return Ok("already running".to_string());
    }

    let resource_dir = app.path().resource_dir()
        .map_err(|e| format!("Cannot get resource dir: {}", e))?;
    let bin_path = constants::llama_bin_path(&resource_dir);

    let model_path = constants::find_model_path()
        .ok_or_else(|| "No model found. Place a .gguf file in ./models/ or ~/models/".to_string())?;

    println!("[{}] Starting llama-server: {} -m {} :8080", APP_NAME, bin_path.display(), model_path.display());

    let child = Command::new(&bin_path)
        .args([
            "-m", &model_path.to_string_lossy(),
            "--port", "8080",
            "--jinja",
            "--host", "127.0.0.1",
            "--ctx-size", "8192",
            "-ngl", "0",
            "--no-ui",
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start llama-server: {}", e))?;

    let pid = child.id();
    {
        let mut lock = state.0.lock().unwrap();
        if let Some(mut old) = lock.take() {
            let _ = old.kill();
        }
        *lock = Some(child);
    }

    println!("[{}] llama-server started (PID: {}), waiting for health...", APP_NAME, pid);

    for i in 0..10 {
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        if check_llama_server().await {
            println!("[{}] llama-server healthy on :8080", APP_NAME);
            return Ok(format!("started (PID: {})", pid));
        }
        println!("[{}] waiting... ({}/10)", APP_NAME, i + 1);
    }

    Err(format!("llama-server (PID: {}) started but not responding on :8080 after 10s", pid))
}

fn kill_llama_child(state: &LlamaState) {
    if let Ok(mut lock) = state.0.lock() {
        if let Some(mut child) = lock.take() {
            let _ = child.kill();
            let _ = child.wait();
            println!("[{}] llama-server child process terminated", APP_NAME);
        }
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
        .manage(wezterm::WeztermState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            start_server,
            stop_server,
            run_shell_command,
            test_fs_real,
            test_fs_write,
            get_home_dir,
            get_project_root,
            save_active_repo,
            get_active_repo,
            check_llama_server,
            start_llama_server,
            wezterm::launch_wezterm_cage,
            config_watcher::read_config_file,
            config_watcher::write_config_file
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(state) = window.try_state::<LlamaState>() {
                    kill_llama_child(&state);
                }
                if let Some(state) = window.try_state::<ServerState>() {
                    if let Ok(mut lock) = state.0.lock() {
                        if let Some(mut child) = lock.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .setup(|app| {
            let llama_state = LlamaState(Mutex::new(None));

            // Try to auto-start llama-server on launch
            if let Ok(resource_dir) = app.path().resource_dir() {
                let bin_path = constants::llama_bin_path(&resource_dir);
                if let Some(model_path) = constants::find_model_path() {
                    println!("[{}] Auto-starting llama-server: {} -m {} :8080", APP_NAME, bin_path.display(), model_path.display());
                    match Command::new(&bin_path)
                        .args([
                            "-m", &model_path.to_string_lossy(),
                            "--port", "8080",
                            "--jinja",
                            "--host", "127.0.0.1",
                            "--ctx-size", "8192",
                            "-ngl", "0",
                            "--no-ui",
                        ])
                        .stdout(Stdio::null())
                        .stderr(Stdio::null())
                        .spawn()
                    {
                        Ok(child) => {
                            println!("[{}] llama-server auto-started (PID: {})", APP_NAME, child.id());
                            *llama_state.0.lock().unwrap() = Some(child);
                        }
                        Err(e) => eprintln!("[{}] Auto-start llama-server failed: {}", APP_NAME, e),
                    }
                } else {
                    println!("[{}] No model found for auto-start. Place .gguf in ./models/ or ~/models/", APP_NAME);
                }
            }

            app.manage(llama_state);

            // Set cwd to PROJECT_ROOT for relative paths
            if let Ok(project_root) = std::env::var("PROJECT_ROOT") {
                if let Ok(canonical) = std::fs::canonicalize(&project_root) {
                    let _ = std::env::set_current_dir(&canonical);
                    println!("[{}] cwd -> {}", APP_NAME, canonical.display());
                }
            }
            let root = std::env::current_dir().unwrap_or_default();
            let _ = test_fs_real();
            auto_create_active_repo(&root);

            let handle = app.handle().clone();
            let watcher = Arc::new(Mutex::new(config_watcher::ConfigWatcher::new()));
            config_watcher::run_watcher_loop(handle, watcher);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
