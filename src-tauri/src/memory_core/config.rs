use std::{env, fs, path::PathBuf};

use crate::memory_core::{
    error::{io_context, MemoryResult},
    types::MemoryConfig,
};

pub fn config_dir() -> MemoryResult<PathBuf> {
    dirs::config_dir()
        .map(|path| path.join("ailu-neural-core"))
        .ok_or_else(|| "could not resolve ~/.config".to_string())
}

pub fn config_path() -> MemoryResult<PathBuf> {
    if let Ok(path) = env::var("AILU_MEMORY_CONFIG_PATH") {
        return Ok(PathBuf::from(path));
    }
    Ok(config_dir()?.join("memory-core.json"))
}

pub fn load_config() -> MemoryResult<MemoryConfig> {
    let path = config_path()?;
    if !path.exists() {
        let config = MemoryConfig::default();
        save_config(&config)?;
        return Ok(config);
    }

    let content = fs::read_to_string(&path)
        .map_err(|error| io_context("read memory config", &path, error))?;
    let mut config: MemoryConfig = serde_json::from_str(&content)
        .map_err(|error| format!("invalid memory config {}: {error}", path.display()))?;
    validate_config(&mut config)?;
    Ok(config)
}

pub fn save_config(config: &MemoryConfig) -> MemoryResult<()> {
    fs::create_dir_all(config_dir()?).map_err(|error| error.to_string())?;
    let mut normalized = config.clone();
    validate_config(&mut normalized)?;
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let content = serde_json::to_string_pretty(&normalized).map_err(|error| error.to_string())?;
    fs::write(&path, content).map_err(|error| io_context("write memory config", &path, error))
}

pub fn validate_config(config: &mut MemoryConfig) -> MemoryResult<()> {
    if config.vault_path.trim().is_empty() {
        config.vault_path = MemoryConfig::default().vault_path;
    }
    if config.max_context_notes == 0 {
        config.max_context_notes = 12;
    }
    if config.max_context_chunks == 0 {
        config.max_context_chunks = 24;
    }
    if config.max_context_chars < 1_000 {
        config.max_context_chars = 24_000;
    }
    if config.max_import_file_bytes == 0 {
        config.max_import_file_bytes = 2_097_152;
    }
    Ok(())
}

pub fn expanded_vault_path(config: &MemoryConfig) -> MemoryResult<PathBuf> {
    if let Ok(path) = env::var("AILU_MEMORY_VAULT_PATH") {
        return expand_tilde(&path);
    }
    expand_tilde(&config.vault_path)
}

pub fn expand_tilde(input: &str) -> MemoryResult<PathBuf> {
    if input == "~" {
        return dirs::home_dir().ok_or_else(|| "could not resolve home directory".to_string());
    }
    if let Some(rest) = input.strip_prefix("~/") {
        return dirs::home_dir()
            .map(|home| home.join(rest))
            .ok_or_else(|| "could not resolve home directory".to_string());
    }
    Ok(PathBuf::from(input))
}
