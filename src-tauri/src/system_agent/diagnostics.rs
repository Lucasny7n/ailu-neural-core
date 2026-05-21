use chrono::Utc;
use uuid::Uuid;

use super::{
    executor::run_program,
    types::{CommandExecutionLog, DiagnosticResult, SystemSnapshot},
};

pub fn collect_snapshot() -> SystemSnapshot {
    let action_id = format!("snapshot-{}", Uuid::new_v4());
    SystemSnapshot {
        generated_at: Utc::now().to_rfc3339(),
        kernel: first_output_line(&run_program(&action_id, "uname", &["-a"], 5_000)),
        hostname: first_output_line(&run_program(&action_id, "hostnamectl", &[], 5_000)),
        uptime: first_output_line(&run_program(&action_id, "uptime", &[], 5_000)),
        memory: run_program(&action_id, "free", &["-h"], 5_000).stdout,
        swap: run_program(&action_id, "swapon", &["--show"], 5_000).stdout,
        disk: run_program(&action_id, "df", &["-h"], 5_000).stdout,
        failed_units: run_program(&action_id, "systemctl", &["--failed"], 8_000).stdout,
        hyprland: run_program(&action_id, "hyprctl", &["version"], 5_000).stdout,
        ollama: run_program(&action_id, "ollama", &["list"], 8_000).stdout,
        gpu: filter_gpu_lines(&run_program(&action_id, "lspci", &[], 5_000).stdout),
    }
}

pub fn run_safe_diagnostic(key: &str) -> Result<DiagnosticResult, String> {
    let action_id = format!("diagnostic-{}", Uuid::new_v4());
    let specs = diagnostic_commands(key)?;
    let mut output = String::new();
    let mut has_error = false;

    for (program, args) in specs.commands {
        let log = run_program(&action_id, program, &args, specs.timeout_ms);
        output.push_str(&format!("$ {}\n", log.command));
        if !log.stdout.trim().is_empty() {
            output.push_str(log.stdout.trim_end());
            output.push('\n');
        }
        if !log.stderr.trim().is_empty() {
            has_error = true;
            output.push_str("[stderr]\n");
            output.push_str(log.stderr.trim_end());
            output.push('\n');
        }
        output.push_str(&format!("[exit {}]\n\n", log.exit_code));
    }

    Ok(DiagnosticResult {
        key: key.to_string(),
        title: specs.title.to_string(),
        status: if has_error { "warning" } else { "success" }.to_string(),
        output: format_diagnostic_output(key, &output),
        generated_at: Utc::now().to_rfc3339(),
    })
}

struct DiagnosticSpec {
    title: &'static str,
    timeout_ms: u64,
    commands: Vec<(&'static str, Vec<&'static str>)>,
}

fn diagnostic_commands(key: &str) -> Result<DiagnosticSpec, String> {
    let spec = match key {
        "system-overview" => DiagnosticSpec {
            title: "Sistema",
            timeout_ms: 8_000,
            commands: vec![
                ("uname", vec!["-a"]),
                ("hostnamectl", vec![]),
                ("uptime", vec![]),
            ],
        },
        "memory" | "ram-zram" => DiagnosticSpec {
            title: "RAM/ZRAM",
            timeout_ms: 8_000,
            commands: vec![
                ("free", vec!["-h"]),
                ("swapon", vec!["--show"]),
                ("zramctl", vec![]),
            ],
        },
        "disk" => DiagnosticSpec {
            title: "Disco",
            timeout_ms: 8_000,
            commands: vec![("lsblk", vec![]), ("df", vec!["-h"])],
        },
        "systemd" => DiagnosticSpec {
            title: "Systemd",
            timeout_ms: 8_000,
            commands: vec![("systemctl", vec!["--failed"])],
        },
        "kernel" | "kernel-logs" => DiagnosticSpec {
            title: "Kernel e logs",
            timeout_ms: 12_000,
            commands: vec![
                (
                    "journalctl",
                    vec!["-p", "3", "-xb", "--no-pager", "-n", "80"],
                ),
                ("journalctl", vec!["-k", "--no-pager", "-n", "80"]),
            ],
        },
        "packages" => DiagnosticSpec {
            title: "Pacotes",
            timeout_ms: 12_000,
            commands: vec![("pacman", vec!["-Qu"]), ("yay", vec!["-Qua"])],
        },
        "hyprland" => DiagnosticSpec {
            title: "Hyprland",
            timeout_ms: 8_000,
            commands: vec![
                ("hyprctl", vec!["version"]),
                ("hyprctl", vec!["monitors"]),
                ("hyprctl", vec!["workspaces"]),
                ("hyprctl", vec!["clients"]),
            ],
        },
        "bluetooth" => DiagnosticSpec {
            title: "Bluetooth",
            timeout_ms: 8_000,
            commands: vec![
                ("bluetoothctl", vec!["show"]),
                ("bluetoothctl", vec!["list"]),
                ("rfkill", vec!["list"]),
            ],
        },
        "network" => DiagnosticSpec {
            title: "Rede",
            timeout_ms: 8_000,
            commands: vec![("nmcli", vec!["device"])],
        },
        "audio" => DiagnosticSpec {
            title: "Audio",
            timeout_ms: 8_000,
            commands: vec![("wpctl", vec!["status"])],
        },
        "ollama" => DiagnosticSpec {
            title: "Ollama",
            timeout_ms: 10_000,
            commands: vec![
                ("ollama", vec!["list"]),
                ("systemctl", vec!["status", "ollama", "--no-pager"]),
            ],
        },
        "gpu" => DiagnosticSpec {
            title: "GPU",
            timeout_ms: 8_000,
            commands: vec![("lspci", vec![])],
        },
        _ => return Err(format!("Diagnostico seguro desconhecido: {key}")),
    };
    Ok(spec)
}

fn first_output_line(log: &CommandExecutionLog) -> String {
    log.stdout
        .lines()
        .next()
        .filter(|line| !line.trim().is_empty())
        .unwrap_or_else(|| log.stderr.lines().next().unwrap_or("indisponivel"))
        .to_string()
}

fn filter_gpu_lines(output: &str) -> String {
    let filtered = output
        .lines()
        .filter(|line| {
            let lower = line.to_lowercase();
            lower.contains("vga") || lower.contains("display") || lower.contains("3d")
        })
        .collect::<Vec<_>>()
        .join("\n");

    if filtered.trim().is_empty() {
        "GPU nao detectada em lspci".to_string()
    } else {
        filtered
    }
}

fn format_diagnostic_output(key: &str, output: &str) -> String {
    if key == "systemd" && output.contains("0 loaded units listed") {
        return "Sem falhas systemd.\n\n".to_string() + output;
    }
    if key == "gpu" {
        return filter_gpu_lines(output);
    }
    output.to_string()
}
