use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::memory_core::{error::MemoryResult, types::MemoryConfig};

#[derive(Debug, Clone)]
pub struct IgnoreRules {
    patterns: Vec<String>,
}

impl IgnoreRules {
    pub fn load(vault_root: &Path) -> Self {
        let path = vault_root.join(".ailu/.ailuignore");
        let content = fs::read_to_string(path).unwrap_or_default();
        let patterns = content
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty() && !line.starts_with('#'))
            .map(ToString::to_string)
            .collect();
        Self { patterns }
    }

    pub fn is_ignored(&self, root: &Path, path: &Path) -> bool {
        let rel = path
            .strip_prefix(root)
            .unwrap_or(path)
            .to_string_lossy()
            .replace('\\', "/");
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default();
        self.patterns
            .iter()
            .any(|pattern| pattern_matches(pattern, &rel, file_name))
    }
}

pub fn should_index_file(
    config: &MemoryConfig,
    root: &Path,
    path: &Path,
    rules: &IgnoreRules,
) -> MemoryResult<bool> {
    if rules.is_ignored(root, path) {
        return Ok(false);
    }
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() || metadata.len() > config.max_import_file_bytes {
        return Ok(false);
    }
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !matches!(extension.as_str(), "md" | "txt" | "json" | "log") {
        return Ok(false);
    }
    Ok(!looks_binary(path)?)
}

pub fn walk_text_files(
    config: &MemoryConfig,
    root: &Path,
    rules: &IgnoreRules,
) -> MemoryResult<Vec<PathBuf>> {
    let mut files = Vec::new();
    walk(config, root, root, rules, &mut files)?;
    files.sort();
    Ok(files)
}

fn walk(
    config: &MemoryConfig,
    root: &Path,
    dir: &Path,
    rules: &IgnoreRules,
    files: &mut Vec<PathBuf>,
) -> MemoryResult<()> {
    for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if rules.is_ignored(root, &path) {
            continue;
        }
        if path.is_dir() {
            walk(config, root, &path, rules, files)?;
        } else if should_index_file(config, root, &path, rules)? {
            files.push(path);
        }
    }
    Ok(())
}

fn pattern_matches(pattern: &str, rel: &str, file_name: &str) -> bool {
    if let Some(dir) = pattern.strip_suffix('/') {
        return rel == dir
            || rel.starts_with(&format!("{dir}/"))
            || rel.contains(&format!("/{dir}/"));
    }
    if let Some(extension) = pattern.strip_prefix("*.") {
        return file_name.ends_with(&format!(".{extension}"));
    }
    if let Some(prefix) = pattern.strip_suffix(".*") {
        return file_name == prefix || file_name.starts_with(&format!("{prefix}."));
    }
    rel == pattern || file_name == pattern || rel.contains(&format!("/{pattern}"))
}

fn looks_binary(path: &Path) -> MemoryResult<bool> {
    let bytes = fs::read(path).map_err(|error| error.to_string())?;
    Ok(bytes.iter().take(4096).any(|byte| *byte == 0))
}
