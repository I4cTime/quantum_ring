---
description: Run a shell command with q-ring-injected secrets and stdout/stderr redaction.
argument-hint: "<command> [args...]"
allowed-tools: mcp__q-ring__exec_with_secrets, mcp__q-ring__check_policy, mcp__q-ring__get_policy_summary
---

# /qring-exec-safe

Run a shell command with q-ring secrets injected into the environment, and stdout/stderr automatically redacted of any known secret values.

The command and args are taken from `$ARGUMENTS`.

## Workflow

1. Confirm `get_policy_summary` / `check_policy` allows `exec_with_secrets` for this project.
2. Call `exec_with_secrets` with explicit argv (array), the workspace as `projectPath`, and minimal secret scope (use `tags` or `keys` to restrict which secrets are loaded).
3. Present stdout/stderr safely; never repeat suspected secret substrings in follow-up messages.

## Safety

- Never log raw command output to public channels without reviewing redaction limits.
- If unsure which secrets the command needs, ask the user — do not load every secret into the environment by default.
- Consider running with `profile: "restricted"` for one-off commands.
