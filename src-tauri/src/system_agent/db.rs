use std::{fs, path::PathBuf};

use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

use super::types::{ActionSummary, AppConfig, CommandExecutionLog, MemoryEdge, SystemActionPlan};

pub fn app_data_dir() -> Result<PathBuf, String> {
    dirs::data_local_dir()
        .map(|path| path.join("ailu-neural-core"))
        .ok_or_else(|| "Nao foi possivel localizar ~/.local/share".to_string())
}

pub fn app_config_dir() -> Result<PathBuf, String> {
    dirs::config_dir()
        .map(|path| path.join("ailu-neural-core"))
        .ok_or_else(|| "Nao foi possivel localizar ~/.config".to_string())
}

pub fn database_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("ailu-neural-core.sqlite"))
}

pub fn config_path() -> Result<PathBuf, String> {
    Ok(app_config_dir()?.join("config.json"))
}

fn open_connection() -> Result<Connection, String> {
    fs::create_dir_all(app_data_dir()?).map_err(|error| error.to_string())?;
    Connection::open(database_path()?).map_err(|error| error.to_string())
}

pub fn init_database() -> Result<(), String> {
    fs::create_dir_all(app_data_dir()?).map_err(|error| error.to_string())?;
    fs::create_dir_all(app_config_dir()?).map_err(|error| error.to_string())?;

    let conn = open_connection()?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS ai_providers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            provider_type TEXT NOT NULL,
            base_url TEXT NOT NULL,
            enabled INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_models (
            id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            model_name TEXT NOT NULL,
            installed INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_actions (
            id TEXT PRIMARY KEY,
            user_request TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            intent TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            risk_summary TEXT NOT NULL,
            commands_json TEXT NOT NULL,
            affected_files_json TEXT NOT NULL,
            affected_packages_json TEXT NOT NULL,
            affected_services_json TEXT NOT NULL,
            target_nodes_json TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            approved_at TEXT,
            executed_at TEXT,
            finished_at TEXT
        );

        CREATE TABLE IF NOT EXISTS system_action_logs (
            id TEXT PRIMARY KEY,
            action_id TEXT NOT NULL,
            command TEXT NOT NULL,
            stdout TEXT NOT NULL,
            stderr TEXT NOT NULL,
            exit_code INTEGER NOT NULL,
            duration_ms INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS operator_confirmations (
            id TEXT PRIMARY KEY,
            action_id TEXT NOT NULL,
            approval_token TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_snapshots (
            id TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS neural_graph_events (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            node_id TEXT,
            connection_id TEXT,
            action_id TEXT,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory_edges (
            id TEXT PRIMARY KEY,
            from_node TEXT NOT NULL,
            to_node TEXT NOT NULL,
            relation TEXT NOT NULL,
            weight REAL NOT NULL,
            source TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        "#,
    )
    .map_err(|error| error.to_string())?;

    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR IGNORE INTO ai_providers (id, name, provider_type, base_url, enabled, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 1, ?5, ?5)",
        params![
            "ollama-local",
            "Ollama Local",
            "local",
            "http://localhost:11434",
            now
        ],
    )
    .map_err(|error| error.to_string())?;

    if !config_path()?.exists() {
        save_config(&AppConfig::default())?;
    }

    Ok(())
}

pub fn save_action(plan: &SystemActionPlan, status: &str) -> Result<(), String> {
    init_database()?;
    let conn = open_connection()?;
    let commands_json = serde_json::to_string(&plan.commands).map_err(|error| error.to_string())?;
    let affected_files_json =
        serde_json::to_string(&plan.affected_files).map_err(|error| error.to_string())?;
    let affected_packages_json =
        serde_json::to_string(&plan.affected_packages).map_err(|error| error.to_string())?;
    let affected_services_json =
        serde_json::to_string(&plan.affected_services).map_err(|error| error.to_string())?;
    let target_nodes_json =
        serde_json::to_string(&plan.target_nodes).map_err(|error| error.to_string())?;

    conn.execute(
        r#"
        INSERT INTO system_actions (
            id, user_request, title, description, intent, risk_level, risk_summary,
            commands_json, affected_files_json, affected_packages_json,
            affected_services_json, target_nodes_json, provider, model, status, created_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
        ON CONFLICT(id) DO UPDATE SET
            user_request = excluded.user_request,
            title = excluded.title,
            description = excluded.description,
            intent = excluded.intent,
            risk_level = excluded.risk_level,
            risk_summary = excluded.risk_summary,
            commands_json = excluded.commands_json,
            affected_files_json = excluded.affected_files_json,
            affected_packages_json = excluded.affected_packages_json,
            affected_services_json = excluded.affected_services_json,
            target_nodes_json = excluded.target_nodes_json,
            provider = excluded.provider,
            model = excluded.model,
            status = excluded.status
        "#,
        params![
            &plan.id,
            &plan.user_request,
            &plan.title,
            &plan.description,
            &plan.intent,
            &plan.risk_level,
            &plan.risk_summary,
            &commands_json,
            &affected_files_json,
            &affected_packages_json,
            &affected_services_json,
            &target_nodes_json,
            &plan.provider,
            &plan.model,
            status,
            &plan.created_at
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn update_action_status(action_id: &str, status: &str) -> Result<(), String> {
    init_database()?;
    let conn = open_connection()?;
    let now = Utc::now().to_rfc3339();
    let field = match status {
        "approved" => "approved_at",
        "running" => "executed_at",
        "success" | "failed" | "canceled" => "finished_at",
        _ => "finished_at",
    };
    let sql = format!("UPDATE system_actions SET status = ?1, {field} = ?2 WHERE id = ?3");
    conn.execute(&sql, params![status, now, action_id])
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn save_approval(action_id: &str, approval_token: &str) -> Result<(), String> {
    init_database()?;
    let conn = open_connection()?;
    conn.execute(
        "INSERT INTO operator_confirmations (id, action_id, approval_token, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![Uuid::new_v4().to_string(), action_id, approval_token, Utc::now().to_rfc3339()],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn save_command_log(log: &CommandExecutionLog) -> Result<(), String> {
    init_database()?;
    let conn = open_connection()?;
    conn.execute(
        "INSERT INTO system_action_logs (id, action_id, command, stdout, stderr, exit_code, duration_ms, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            &log.id,
            &log.action_id,
            &log.command,
            &log.stdout,
            &log.stderr,
            log.exit_code,
            log.duration_ms as i64,
            &log.created_at
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn list_recent_actions(limit: u32) -> Result<Vec<ActionSummary>, String> {
    init_database()?;
    let conn = open_connection()?;
    let mut statement = conn
        .prepare(
            "SELECT id, user_request, title, intent, risk_level, status, provider, model, created_at
             FROM system_actions ORDER BY created_at DESC LIMIT ?1",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map(params![limit], |row| {
            Ok(ActionSummary {
                id: row.get(0)?,
                user_request: row.get(1)?,
                title: row.get(2)?,
                intent: row.get(3)?,
                risk_level: row.get(4)?,
                status: row.get(5)?,
                provider: row.get(6)?,
                model: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn read_config() -> Result<AppConfig, String> {
    init_database()?;
    let path = config_path()?;
    if !path.exists() {
        let config = AppConfig::default();
        save_config(&config)?;
        return Ok(config);
    }
    let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str::<AppConfig>(&contents).map_err(|error| error.to_string())
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    fs::create_dir_all(app_config_dir()?).map_err(|error| error.to_string())?;
    let mut sanitized = config.clone();
    sanitized.require_approval_for_all_actions = true;
    let contents = serde_json::to_string_pretty(&sanitized).map_err(|error| error.to_string())?;
    fs::write(config_path()?, contents).map_err(|error| error.to_string())
}

pub fn save_memory_edge(edge: &MemoryEdge) -> Result<MemoryEdge, String> {
    init_database()?;
    let conn = open_connection()?;
    let now = Utc::now().to_rfc3339();
    let id = edge
        .id
        .clone()
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    let saved = MemoryEdge {
        id: Some(id.clone()),
        from_node: edge.from_node.clone(),
        to_node: edge.to_node.clone(),
        relation: edge.relation.clone(),
        weight: edge.weight,
        source: edge.source.clone(),
        created_at: Some(edge.created_at.clone().unwrap_or_else(|| now.clone())),
        updated_at: Some(now.clone()),
    };

    conn.execute(
        "INSERT INTO memory_edges (id, from_node, to_node, relation, weight, source, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET relation = excluded.relation, weight = excluded.weight, source = excluded.source, updated_at = excluded.updated_at",
        params![
            &id,
            &saved.from_node,
            &saved.to_node,
            &saved.relation,
            saved.weight,
            &saved.source,
            &saved.created_at,
            &saved.updated_at
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(saved)
}

pub fn related_memory_edges(node_id: &str) -> Result<Vec<MemoryEdge>, String> {
    init_database()?;
    let conn = open_connection()?;
    let mut statement = conn
        .prepare(
            "SELECT id, from_node, to_node, relation, weight, source, created_at, updated_at
             FROM memory_edges WHERE from_node = ?1 OR to_node = ?1 ORDER BY updated_at DESC LIMIT 80",
        )
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map(params![node_id], |row| {
            Ok(MemoryEdge {
                id: Some(row.get(0)?),
                from_node: row.get(1)?,
                to_node: row.get(2)?,
                relation: row.get(3)?,
                weight: row.get(4)?,
                source: row.get(5)?,
                created_at: Some(row.get(6)?),
                updated_at: Some(row.get(7)?),
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}
