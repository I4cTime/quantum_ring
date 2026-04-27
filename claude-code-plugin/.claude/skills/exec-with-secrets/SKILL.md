---
name: exec-with-secrets
description: Run shell commands with secrets injected from q-ring with stdout/stderr redaction and policy checks. Use when the user wants to run tests, migrations, or CLIs that need API keys without pasting secrets into the shell or .env.
---

# Exec with Secrets (MCP)

## When to use

- Running a project script that reads env vars you keep in q-ring
- One-off CLI tools (`curl`, SDK CLIs) that need a token from the keyring
- CI-like commands where redaction and `policy.exec` matter

## Tool

| Task | MCP tool |
|------|----------|
| Run command with env from q-ring | `exec_with_secrets` |

## Workflow

1. Call `get_policy_summary` if unsure whether `exec_with_secrets` is allowed (`policy.mcp` may deny this tool).
2. Prefer `check_policy` with `action: "exec"` when experimenting with deny/allow rules.
3. Call `exec_with_secrets` with the argv array, `projectPath`, and optional key filters so only required secrets are loaded.

## Safety

- Never log raw command output to public channels without reviewing redaction limits.
- Prefer `tunnel_create` / `tunnel_read` for one-off handoff of a single value to another agent when full `exec` is unnecessary.
- Use exec profiles (`restricted`, `ci`, `unrestricted`) to bound command behavior.
