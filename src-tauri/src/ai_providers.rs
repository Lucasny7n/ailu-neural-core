use std::process::Command;

#[tauri::command]
pub async fn ai_provider_check_openclaude() -> Result<String, String> {
    let output = Command::new("openclaude")
        .arg("--version")
        .output()
        .map_err(|e| format!("Falha ao executar openclaude: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
pub async fn ai_provider_run_openclaude_prompt(prompt: String) -> Result<String, String> {
    let output = Command::new("openclaude")
        .arg("-p")
        .arg(prompt)
        .arg("--json")
        .output()
        .map_err(|e| format!("Falha ao executar prompt no openclaude: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}
