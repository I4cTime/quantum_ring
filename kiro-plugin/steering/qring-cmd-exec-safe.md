---
inclusion: manual
---

# q-ring · Exec Safe (command)

> Activate by typing `#qring-cmd-exec-safe` in chat.

Run a shell command with q-ring injected secrets and redaction. Use when the user needs to run builds/tests/tools that require env vars stored in q-ring.

## Workflow

1. Confirm `get_policy_summary` / `check_policy` allows `exec_with_secrets` for this project.
2. Call `exec_with_secrets` with explicit argv (array), working directory, and minimal secret scope.
3. Present stdout/stderr safely; never repeat suspected secret substrings in follow-up messages.

See skill `#qring-exec-with-secrets` for full patterns.
