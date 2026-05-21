use std::{
    io::Read,
    process::{Command, Stdio},
    time::{Duration, Instant},
};

use chrono::Utc;
use uuid::Uuid;
use wait_timeout::ChildExt;

use super::types::{CommandExecutionLog, PlannedCommand};

pub fn approval_token_for(action_id: &str) -> String {
    format!("approval:{action_id}")
}

pub fn validate_approval(action_id: &str, approval_token: &str) -> bool {
    approval_token == approval_token_for(action_id)
}

pub fn execute_commands(
    action_id: &str,
    approval_token: &str,
    commands: &[PlannedCommand],
) -> Result<Vec<CommandExecutionLog>, String> {
    if !validate_approval(action_id, approval_token) {
        return Err(
            "Approval token invalido. A acao nao foi autorizada pelo operador.".to_string(),
        );
    }

    let mut logs = Vec::with_capacity(commands.len());
    for command in commands {
        if command.command.trim().is_empty() {
            return Err("Comando vazio bloqueado pelo executor.".to_string());
        }
        logs.push(run_shell_command(action_id, command)?);
    }

    Ok(logs)
}

pub fn run_shell_command(
    action_id: &str,
    planned: &PlannedCommand,
) -> Result<CommandExecutionLog, String> {
    let started = Instant::now();
    let timeout_ms = planned.timeout_ms.unwrap_or(20_000).clamp(1_000, 120_000);
    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg(&planned.command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(cwd) = &planned.cwd {
        if !cwd.trim().is_empty() {
            command.current_dir(cwd);
        }
    }

    let mut child = command.spawn().map_err(|error| error.to_string())?;
    let status = match child
        .wait_timeout(Duration::from_millis(timeout_ms))
        .map_err(|error| error.to_string())?
    {
        Some(status) => status,
        None => {
            let _ = child.kill();
            let status = child.wait().map_err(|error| error.to_string())?;
            let mut log = collect_child_output(
                action_id,
                &planned.command,
                started,
                status.code().unwrap_or(-1),
                child,
            )?;
            log.stderr = append_line(log.stderr, &format!("timeout after {timeout_ms}ms"));
            return Ok(log);
        }
    };

    collect_child_output(
        action_id,
        &planned.command,
        started,
        status.code().unwrap_or(-1),
        child,
    )
}

pub fn run_program(
    action_id: &str,
    program: &str,
    args: &[&str],
    timeout_ms: u64,
) -> CommandExecutionLog {
    let planned = PlannedCommand {
        id: format!("diag-{}", Uuid::new_v4()),
        command: std::iter::once(program.to_string())
            .chain(args.iter().map(|value| value.to_string()))
            .collect::<Vec<_>>()
            .join(" "),
        description: "diagnostico seguro".to_string(),
        cwd: None,
        timeout_ms: Some(timeout_ms),
        requires_sudo: false,
        destructive: false,
    };

    let started = Instant::now();
    let mut command = Command::new(program);
    command
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let spawn_result = command.spawn();
    let mut child = match spawn_result {
        Ok(child) => child,
        Err(error) => {
            return CommandExecutionLog {
                id: Uuid::new_v4().to_string(),
                action_id: action_id.to_string(),
                command: planned.command,
                stdout: String::new(),
                stderr: error.to_string(),
                exit_code: 127,
                duration_ms: started.elapsed().as_millis(),
                created_at: Utc::now().to_rfc3339(),
            };
        }
    };

    let status = match child.wait_timeout(Duration::from_millis(timeout_ms)) {
        Ok(Some(status)) => status,
        Ok(None) => {
            let _ = child.kill();
            let status = child
                .wait()
                .ok()
                .and_then(|value| value.code())
                .unwrap_or(-1);
            return collect_child_output(action_id, &planned.command, started, status, child)
                .map(|mut log| {
                    log.stderr = append_line(log.stderr, &format!("timeout after {timeout_ms}ms"));
                    log
                })
                .unwrap_or_else(|error| CommandExecutionLog {
                    id: Uuid::new_v4().to_string(),
                    action_id: action_id.to_string(),
                    command: planned.command,
                    stdout: String::new(),
                    stderr: error,
                    exit_code: -1,
                    duration_ms: started.elapsed().as_millis(),
                    created_at: Utc::now().to_rfc3339(),
                });
        }
        Err(error) => {
            return CommandExecutionLog {
                id: Uuid::new_v4().to_string(),
                action_id: action_id.to_string(),
                command: planned.command,
                stdout: String::new(),
                stderr: error.to_string(),
                exit_code: -1,
                duration_ms: started.elapsed().as_millis(),
                created_at: Utc::now().to_rfc3339(),
            };
        }
    };

    collect_child_output(
        action_id,
        &planned.command,
        started,
        status.code().unwrap_or(-1),
        child,
    )
    .unwrap_or_else(|error| CommandExecutionLog {
        id: Uuid::new_v4().to_string(),
        action_id: action_id.to_string(),
        command: planned.command,
        stdout: String::new(),
        stderr: error,
        exit_code: -1,
        duration_ms: started.elapsed().as_millis(),
        created_at: Utc::now().to_rfc3339(),
    })
}

fn collect_child_output(
    action_id: &str,
    command: &str,
    started: Instant,
    exit_code: i32,
    mut child: std::process::Child,
) -> Result<CommandExecutionLog, String> {
    let mut stdout = String::new();
    let mut stderr = String::new();

    if let Some(mut pipe) = child.stdout.take() {
        pipe.read_to_string(&mut stdout)
            .map_err(|error| error.to_string())?;
    }
    if let Some(mut pipe) = child.stderr.take() {
        pipe.read_to_string(&mut stderr)
            .map_err(|error| error.to_string())?;
    }

    Ok(CommandExecutionLog {
        id: Uuid::new_v4().to_string(),
        action_id: action_id.to_string(),
        command: command.to_string(),
        stdout,
        stderr,
        exit_code,
        duration_ms: started.elapsed().as_millis(),
        created_at: Utc::now().to_rfc3339(),
    })
}

fn append_line(mut existing: String, line: &str) -> String {
    if !existing.is_empty() && !existing.ends_with('\n') {
        existing.push('\n');
    }
    existing.push_str(line);
    existing
}
