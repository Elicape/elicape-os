use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::State;

struct WeztermState(Mutex<Option<Child>>);

#[tauri::command]
fn launch_wezterm_cage(state: State<'_, WeztermState>, project_root: String) -> Result<u32, String> {
    let mut lock = state.0.lock().map_err(|_| "Failed to lock wezterm state")?;

    if let Some(mut child) = lock.take() {
        let _ = child.kill();
    }

    let child = Command::new("./bin/wezterm.AppImage")
        .args([
            "--config-file",
            &format!("{}/.config/wezterm/elicape.lua", std::env::var("HOME").unwrap_or_default()),
            "start",
            "--",
            "bash",
        ])
        .env("PROJECT_ROOT", &project_root)
        .env("HISTFILE", "/dev/null")
        .env("PATH", "/usr/local/bin:/usr/bin:/bin")
        .spawn()
        .map_err(|e| format!("Failed to launch wezterm: {}", e))?;

    let pid = child.id();
    *lock = Some(child);
    Ok(pid)
}
