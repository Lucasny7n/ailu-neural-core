mod ai_providers;
mod memory_core;
mod system_agent;

fn main() {
    if let Err(error) = system_agent::db::init_database() {
        eprintln!("failed to initialize Ailu Neural Core database: {error}");
    }
    if let Err(error) = memory_core::db::init_database() {
        eprintln!("failed to initialize Ailu Memory Core database: {error}");
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
            system_agent::commands::get_related_memory_edges,
            ai_providers::ai_provider_check_openclaude,
            ai_providers::ai_provider_run_openclaude_prompt,
            memory_core::memory_get_config,
            memory_core::memory_set_config,
            memory_core::memory_init_vault,
            memory_core::memory_scan_vault,
            memory_core::memory_import_path,
            memory_core::memory_create_note,
            memory_core::memory_update_note,
            memory_core::memory_delete_note,
            memory_core::memory_get_note,
            memory_core::memory_search,
            memory_core::memory_get_graph,
            memory_core::memory_get_backlinks,
            memory_core::memory_get_related,
            memory_core::memory_build_context,
            memory_core::memory_capture_conversation,
            memory_core::memory_capture_decision,
            memory_core::memory_capture_rule,
            memory_core::memory_capture_action,
            memory_core::memory_capture_dream,
            memory_core::memory_pin_note,
            memory_core::memory_unpin_note,
            memory_core::memory_forget_note,
            memory_core::memory_get_stats
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Ailu Neural Core");
}
