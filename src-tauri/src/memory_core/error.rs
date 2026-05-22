pub type MemoryResult<T> = Result<T, String>;

pub fn err(message: impl Into<String>) -> String {
    message.into()
}

pub fn io_context(action: &str, path: &std::path::Path, error: std::io::Error) -> String {
    format!("{action} failed for {}: {error}", path.display())
}
