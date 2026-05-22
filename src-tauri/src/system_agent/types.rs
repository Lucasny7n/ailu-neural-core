use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlannedCommand {
    pub id: String,
    pub command: String,
    pub description: String,
    pub cwd: Option<String>,
    pub timeout_ms: Option<u64>,
    pub requires_sudo: bool,
    pub destructive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemActionPlan {
    pub id: String,
    pub user_request: String,
    pub title: String,
    pub description: String,
    pub intent: String,
    pub risk_level: String,
    pub risk_summary: String,
    pub commands: Vec<PlannedCommand>,
    pub affected_files: Vec<String>,
    pub affected_packages: Vec<String>,
    pub affected_services: Vec<String>,
    pub target_nodes: Vec<String>,
    pub requires_confirmation: bool,
    pub model: String,
    pub provider: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandExecutionLog {
    pub id: String,
    pub action_id: String,
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u128,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticResult {
    pub key: String,
    pub title: String,
    pub status: String,
    pub output: String,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSnapshot {
    pub generated_at: String,
    pub kernel: String,
    pub hostname: String,
    pub uptime: String,
    pub memory: String,
    pub swap: String,
    pub disk: String,
    pub failed_units: String,
    pub hyprland: String,
    pub ollama: String,
    pub gpu: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionSummary {
    pub id: String,
    pub user_request: String,
    pub title: String,
    pub intent: String,
    pub risk_level: String,
    pub status: String,
    pub provider: String,
    pub model: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub default_provider: String,
    pub default_model: String,
    pub ollama_base_url: String,
    pub theme: String,
    #[serde(default = "default_galaxy_quality")]
    pub galaxy_quality: String,
    #[serde(default = "default_particle_density")]
    pub particle_density: String,
    #[serde(default = "default_true")]
    pub show_secondary_connections: bool,
    #[serde(default = "default_true")]
    pub show_orbits: bool,
    pub reduced_motion: bool,
    pub max_particles: u32,
    pub enable_command_execution: bool,
    pub require_approval_for_all_actions: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            default_provider: "ollama-local".to_string(),
            default_model: "qwen2.5-coder:1.5b".to_string(),
            ollama_base_url: "http://localhost:11434".to_string(),
            theme: "neural-dark".to_string(),
            galaxy_quality: default_galaxy_quality(),
            particle_density: default_particle_density(),
            show_secondary_connections: true,
            show_orbits: true,
            reduced_motion: false,
            max_particles: 700,
            enable_command_execution: true,
            require_approval_for_all_actions: true,
        }
    }
}

fn default_galaxy_quality() -> String {
    "high".to_string()
}

fn default_particle_density() -> String {
    "medium".to_string()
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryEdge {
    pub id: Option<String>,
    pub from_node: String,
    pub to_node: String,
    pub relation: String,
    pub weight: f64,
    pub source: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
