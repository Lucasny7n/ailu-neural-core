use std::{
    collections::hash_map::DefaultHasher,
    fs,
    hash::{Hash, Hasher},
    path::{Component, Path, PathBuf},
};

use chrono::Utc;

use crate::memory_core::{
    config,
    error::{err, io_context, MemoryResult},
    types::{MemoryConfig, MemoryNoteKind},
};

const DEFAULT_AILUIGNORE: &str = r#".env
.env.*
*.key
*.pem
*.p12
*.sqlite
*.sqlite3
*.db
.git/
.ailu/
node_modules/
target/
src-tauri/target/
dist/
build/
.cache/
*.png
*.jpg
*.jpeg
*.webp
*.gif
*.mp4
*.mkv
*.zip
*.tar
*.gz
*.7z
"#;

pub fn init_vault(config: &MemoryConfig) -> MemoryResult<PathBuf> {
    let root = config::expanded_vault_path(config)?;
    for dir in [
        "notes/projects",
        "notes/system",
        "notes/conversations",
        "notes/decisions",
        "notes/actions",
        "notes/rules",
        "notes/dreams",
        "notes/imports",
        "attachments",
        ".ailu",
    ] {
        fs::create_dir_all(root.join(dir))
            .map_err(|error| io_context("create vault directory", &root.join(dir), error))?;
    }
    write_if_missing(&root.join(".ailu/.ailuignore"), DEFAULT_AILUIGNORE)?;
    write_if_missing(&root.join(".ailu/manifest.json"), "{}\n")?;
    write_if_missing(
        &root.join(".ailu/graph-cache.json"),
        "{\"nodes\":[],\"edges\":[]}\n",
    )?;
    write_if_missing(&root.join(".ailu/ingestion-log.json"), "[]\n")?;
    Ok(root)
}

pub fn ensure_vault() -> MemoryResult<(MemoryConfig, PathBuf)> {
    let config = config::load_config()?;
    let root = init_vault(&config)?;
    Ok((config, root))
}

pub fn safe_join(root: &Path, relative: &str) -> MemoryResult<PathBuf> {
    if relative.trim().is_empty() || relative.contains('\0') {
        return Err(err("empty or invalid relative vault path"));
    }
    let rel = Path::new(relative);
    if rel.is_absolute() {
        return Err(err(
            "absolute paths are not allowed inside the memory vault",
        ));
    }
    for component in rel.components() {
        if matches!(
            component,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        ) {
            return Err(err("path traversal blocked by Memory Core"));
        }
    }
    let joined = root.join(rel);
    let parent = joined.parent().unwrap_or(root);
    fs::create_dir_all(parent).map_err(|error| io_context("create vault parent", parent, error))?;
    Ok(joined)
}

pub fn relative_path(root: &Path, path: &Path) -> MemoryResult<String> {
    path.strip_prefix(root)
        .map_err(|_| format!("path escapes memory vault: {}", path.display()))
        .map(|path| path.to_string_lossy().replace('\\', "/"))
}

pub fn create_note_file(
    config: &MemoryConfig,
    title: &str,
    kind: MemoryNoteKind,
    body: &str,
    dated: bool,
) -> MemoryResult<PathBuf> {
    let root = init_vault(config)?;
    let now = Utc::now().to_rfc3339();
    let date = now.split('T').next().unwrap_or("unknown-date");
    let slug = slugify(title);
    let folder = if dated {
        format!("notes/{}/{date}", kind.folder())
    } else {
        format!("notes/{}", kind.folder())
    };
    let relative = format!("{folder}/{slug}.md");
    let path = safe_join(&root, &relative)?;
    let content = if body.trim_start().starts_with("---") {
        body.to_string()
    } else {
        format!(
            "---\ntitle: {title}\nkind: {}\ntags: [{}]\ncreated: {now}\nupdated: {now}\n---\n\n# {title}\n\n{}\n",
            kind.as_str(),
            kind.as_str(),
            body.trim()
        )
    };
    fs::write(&path, content).map_err(|error| io_context("write memory note", &path, error))?;
    Ok(path)
}

pub fn read_note(root: &Path, relative: &str) -> MemoryResult<String> {
    let path = safe_join(root, relative)?;
    fs::read_to_string(&path).map_err(|error| io_context("read memory note", &path, error))
}

pub fn update_note(root: &Path, relative: &str, content: &str) -> MemoryResult<()> {
    let path = safe_join(root, relative)?;
    fs::write(&path, content).map_err(|error| io_context("update memory note", &path, error))
}

pub fn delete_note(root: &Path, relative: &str) -> MemoryResult<()> {
    let path = safe_join(root, relative)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| io_context("delete memory note", &path, error))?;
    }
    Ok(())
}

pub fn infer_kind_from_path(path: &str) -> MemoryNoteKind {
    for kind in [
        MemoryNoteKind::Project,
        MemoryNoteKind::System,
        MemoryNoteKind::Conversation,
        MemoryNoteKind::Decision,
        MemoryNoteKind::Action,
        MemoryNoteKind::Rule,
        MemoryNoteKind::Dream,
        MemoryNoteKind::Import,
    ] {
        let marker = format!("/{}{}", kind.folder(), "/");
        if path.contains(&marker) || path.starts_with(&format!("notes/{}/", kind.folder())) {
            return kind;
        }
    }
    MemoryNoteKind::Note
}

pub fn slugify(input: &str) -> String {
    let mut slug = String::new();
    let mut previous_dash = false;
    for ch in input.to_lowercase().chars() {
        let mapped = match ch {
            'a'..='z' | '0'..='9' => Some(ch),
            'á' | 'à' | 'â' | 'ã' | 'ä' => Some('a'),
            'é' | 'è' | 'ê' | 'ë' => Some('e'),
            'í' | 'ì' | 'î' | 'ï' => Some('i'),
            'ó' | 'ò' | 'ô' | 'õ' | 'ö' => Some('o'),
            'ú' | 'ù' | 'û' | 'ü' => Some('u'),
            'ç' => Some('c'),
            _ => None,
        };
        if let Some(value) = mapped {
            slug.push(value);
            previous_dash = false;
        } else if !previous_dash {
            slug.push('-');
            previous_dash = true;
        }
    }
    slug.trim_matches('-')
        .to_string()
        .chars()
        .take(96)
        .collect::<String>()
        .if_empty("note")
}

pub fn stable_id(prefix: &str, value: &str) -> String {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    format!("{prefix}_{:016x}", hasher.finish())
}

pub fn content_hash(content: &str) -> String {
    stable_id("hash", content)
}

fn write_if_missing(path: &Path, content: &str) -> MemoryResult<()> {
    if !path.exists() {
        fs::write(path, content)
            .map_err(|error| io_context("write vault seed file", path, error))?;
    }
    Ok(())
}

trait IfEmpty {
    fn if_empty(self, fallback: &str) -> String;
}

impl IfEmpty for String {
    fn if_empty(self, fallback: &str) -> String {
        if self.is_empty() {
            fallback.to_string()
        } else {
            self
        }
    }
}
