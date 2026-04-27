---
inclusion: always
---

# q-ring · Secret Hygiene

Enforce secret hygiene across this workspace — never hardcode credentials.

- **Never** hardcode secrets, API keys, tokens, passwords, or connection strings in source code or config files.
- Store secrets using the `set_secret` MCP tool or `qring set` CLI — not in `.env` files, inline strings, or comments.
- Reference secrets in code via `process.env.KEY` (JS/TS), `os.environ["KEY"]` (Python), or the equivalent for the project language. The actual value lives in q-ring.
- When reviewing or writing code, flag any string that matches common credential patterns (`sk-*`, `ghp_*`, `Bearer *`, long base64 blobs, connection strings with passwords).
- If you spot a hardcoded secret, offer to run `scan_codebase_for_secrets` and `lint_files` with `fix: true` to migrate it into q-ring.
- Secrets with a TTL or rotation format should always be stored with `ttlSeconds` or `rotationFormat` so q-ring can track decay and automate rotation.
- When a shell command contains what looks like a secret value (long base64, `sk-*`, `ghp_*`, etc.), warn the user that secrets should not appear in shell history. Suggest `exec_with_secrets` instead.
