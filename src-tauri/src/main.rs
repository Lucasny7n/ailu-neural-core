mod system_agent;

fn main() {
    if let Err(error) = system_agent::db::init_database() {
        eprintln!("failed to initialize Ailu Neural Core database: {error}");
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            system_agent::commands::get_system_snapshot,
            system_agent::commands::run_safe_diagnostic,
            system_agent::commands::execute_approved_action,
            system_agent::commands::record_system_action,
            system_agent::commands::list_recent_actions,
            system_agent::commands::get_config_state,
            system_agent::commands::save_config_state,
            system_agent::commands::add_memory_edge,
            system_agent::commands::get_related_memory_edges
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Ailu Neural Core");
}
