use super::{
    db, diagnostics, executor,
    types::{
        ActionSummary, AppConfig, CommandExecutionLog, DiagnosticResult, MemoryEdge,
        PlannedCommand, SystemActionPlan, SystemSnapshot,
    },
};

#[tauri::command]
pub fn get_system_snapshot() -> Result<SystemSnapshot, String> {
    Ok(diagnostics::collect_snapshot())
}

#[tauri::command]
pub fn run_safe_diagnostic(key: String) -> Result<DiagnosticResult, String> {
    diagnostics::run_safe_diagnostic(&key)
}

#[tauri::command(rename_all = "camelCase")]
pub fn execute_approved_action(
    action_id: String,
    approval_token: String,
    commands: Vec<PlannedCommand>,
) -> Result<Vec<CommandExecutionLog>, String> {
    db::save_approval(&action_id, &approval_token)?;
    db::update_action_status(&action_id, "running")?;
    let logs = executor::execute_commands(&action_id, &approval_token, &commands)?;
    let failed = logs.iter().any(|log| log.exit_code != 0);
    for log in &logs {
        db::save_command_log(log)?;
    }
    db::update_action_status(&action_id, if failed { "failed" } else { "success" })?;
    Ok(logs)
}

#[tauri::command]
pub fn record_system_action(plan: SystemActionPlan, status: Option<String>) -> Result<(), String> {
    db::save_action(&plan, status.as_deref().unwrap_or("planned"))
}

#[tauri::command]
pub fn list_recent_actions(limit: Option<u32>) -> Result<Vec<ActionSummary>, String> {
    db::list_recent_actions(limit.unwrap_or(50).clamp(1, 200))
}

#[tauri::command]
pub fn get_config_state() -> Result<AppConfig, String> {
    db::read_config()
}

#[tauri::command]
pub fn save_config_state(config: AppConfig) -> Result<AppConfig, String> {
    db::save_config(&config)?;
    db::read_config()
}

#[tauri::command]
pub fn add_memory_edge(edge: MemoryEdge) -> Result<MemoryEdge, String> {
    db::save_memory_edge(&edge)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_related_memory_edges(node_id: String) -> Result<Vec<MemoryEdge>, String> {
    db::related_memory_edges(&node_id)
}
