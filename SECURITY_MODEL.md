# Security Model

Ailu Neural Core follows a strict local approval model.

## Rules

- AI plans only.
- Operator approves.
- Executor runs.
- Logs are saved.
- No command runs hidden in the background.
- No remote executor endpoint exists.
- No `sudo` is used by the implementation itself.

## Approval Token

The frontend sends an approval token in the format:

```txt
approval:<actionId>
```

The Rust executor rejects command execution if the token does not match the action id.

This is a local flow gate, not a cryptographic security boundary. The main protection is explicit UI review plus a local-only Tauri command surface.

## Destructive Commands

The MVP allows the operator to approve edited commands, but the UI surfaces:

- risk level;
- destructive flag;
- sudo flag;
- affected files;
- affected packages;
- affected services.

Fallback plans avoid immediate destructive package removal for high-risk requests such as Steam removal. They start with diagnostics and require manual command edits for irreversible operations.

## Persistence

SQLite stores:

- action plans;
- command logs;
- approvals;
- system snapshots;
- neural graph events;
- memory edges.

API keys are not required in the current MVP and are not stored.
