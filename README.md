# Ailu Neural Core

Ailu Neural Core is a local desktop MVP for a navigable 3D AI control surface. It combines a React Three Fiber neural space, an Ollama-based planning router, a mandatory Approval Layer, and a Tauri/Rust System Agent for safe local diagnostics and approved command execution.

The project is new and independent from `ailu-ai-studio`.

## Current MVP

- 3D neural space with a central Ailu core, connected system nodes, orbit/zoom controls, node selection, connection travel, and progressive child nodes.
- Operator command console that turns natural-language requests into structured `SystemActionPlan` objects.
- Ollama Local provider support using `qwen2.5-coder:1.5b` at `http://localhost:11434`.
- Local fallback planner for known Arch/Hyprland requests when Ollama is offline or returns invalid JSON.
- Approval Layer that shows risk, affected files/packages/services, commands, provider/model, edit/copy/cancel/execute controls.
- Tauri System Agent with safe diagnostics and approved command execution.
- SQLite operational memory initialized at `~/.local/share/ailu-neural-core/ailu-neural-core.sqlite`.
- Local config at `~/.config/ailu-neural-core/config.json`.

## Install

```bash
npm install
```

System requirements:

- Node.js and npm
- Rust and Cargo
- Tauri v2 native dependencies for Linux
- Optional: Ollama running locally

## Development

Frontend only:

```bash
npm run dev
```

Desktop app:

```bash
npm run tauri:dev
```

## Build

```bash
npm run build
npm run tauri:build
```

## Validation

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

## Ollama

Default provider:

```json
{
  "id": "ollama-local",
  "baseUrl": "http://localhost:11434",
  "defaultModel": "qwen2.5-coder:1.5b"
}
```

The router calls:

- `GET /api/tags` for provider/model status.
- `POST /api/generate` for JSON action planning.

If Ollama is unavailable, the app uses a safe local rule-based planner.

## Approval Layer

The AI never executes commands directly. The flow is:

1. Operator sends a natural-language order.
2. AI Router creates a structured plan.
3. Approval Layer displays risk, commands, services, packages, files and target neural nodes.
4. Operator can edit commands.
5. Only the `Executar` button sends commands to the Tauri executor.
6. Execution logs are saved and shown in Telemetry.

## System Agent

The Rust backend exposes local-only Tauri commands for:

- safe diagnostics such as `uname -a`, `free -h`, `systemctl --failed`, `journalctl`, `hyprctl`, `wpctl`, `ollama list`;
- recording actions in SQLite;
- executing approved command lists sequentially;
- saving stdout, stderr, exit code and duration.

No remote endpoint is created.

## Neural Space

The 3D scene is not decorative. Nodes and connections reflect planning and execution states:

- ready
- thinking
- approval
- running
- success
- warning
- error

The first graph includes Kernel, Systemd, Hyprland, Quickshell, Pacman/Yay, Ollama, Memory, Bluetooth, Network, Audio, GPU, RAM/ZRAM, Disk, Logs and Actions.
