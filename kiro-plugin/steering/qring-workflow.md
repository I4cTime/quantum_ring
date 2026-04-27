---
inclusion: always
---

# q-ring · Workflow

Use q-ring MCP tools for **all** secret operations — never access the OS keychain directly.

- Use q-ring MCP tools (`get_secret`, `set_secret`, `list_secrets`, etc.) for every secret operation. Never call OS keychain APIs directly.
- Before working with a project's secrets for the first time, call `get_project_context` to understand what secrets exist, their scopes, and any governance policy.
- If the project has a `.q-ring.json` file, call `check_policy` before performing tool or exec actions to respect governance rules.
- After writing or deleting a secret, remind the user that q-ring maintains a tamper-evident audit trail accessible via `audit_log`.
- For ephemeral values (one-time tokens, OTPs), use `tunnel_create` instead of `set_secret` — tunnels are memory-only and self-destruct after a TTL or read count.
- For sharing secrets across machines, use `teleport_pack` / `teleport_unpack` — never paste raw credentials into chat or files.
- Treat the q-ring MCP server (`q-ring`) as the single source of truth for secret values. Treat `.env` files as derived artifacts produced by `env_generate`.
