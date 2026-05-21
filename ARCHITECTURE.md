# Architecture

## Frontend

- React + TypeScript + Vite
- React Three Fiber, Three.js and Drei for the neural scene
- Zustand for UI state
- CSS global tokens and HUD surfaces

Key areas:

- `src/features/neural-space/`: 3D graph, HUD panels, operator console and neural events.
- `src/features/ai-router/`: Ollama client, planner prompt, structured parser and fallback planner.
- `src/features/approval/`: mandatory authorization overlay.
- `src/features/system-agent/`: Tauri client wrappers and system types.
- `src/features/memory-graph/`: Graphiti-ready memory service abstraction.

## Backend

- Tauri v2
- Rust command handlers
- SQLite through `rusqlite`
- Local config in `~/.config/ailu-neural-core/config.json`
- Operational database in `~/.local/share/ailu-neural-core/ailu-neural-core.sqlite`

Backend modules:

- `diagnostics.rs`: safe read-only command registry.
- `executor.rs`: approved sequential command executor.
- `db.rs`: SQLite schema, action logs, config and memory edges.
- `commands.rs`: Tauri invoke surface.

## Data Flow

1. Operator command enters `OperatorCommandConsole`.
2. `aiRouter` checks Ollama status.
3. Ollama generates JSON or fallback planner creates a safe local plan.
4. Plan is stored in UI state and recorded in SQLite when Tauri is available.
5. `ApprovalLayer` shows commands and allows edits.
6. Execution sends `approval:<actionId>` to Rust.
7. Rust validates the token, runs commands one by one and saves logs.
8. UI updates telemetry, node states and memory edges.

## Graphiti-Ready Memory

`MemoryGraphService` is intentionally small:

- `addEpisode`
- `addEdge`
- `getRelatedNodes`
- `getActionContext`

The MVP persists simple edges in SQLite. A future Graphiti backend can replace this implementation without changing the UI contract.
