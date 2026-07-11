---
name: secret-management
description: Manage secrets stored in q-ring — store, retrieve, list, inspect, import, export, and configure superposition, decay, entanglement, and tags. Use when the user mentions secrets, API keys, tokens, credentials, environment variables, .env files, or asks to store/retrieve/delete a value securely.
---

# Secret Management

## When to use

Activate when the user:
- Asks to store, retrieve, delete, or list secrets
- Mentions API keys, tokens, passwords, credentials, or environment variables
- Wants to import from or export to `.env` files
- Needs superposition (per-environment values) or entanglement (linked secrets)
- Asks about secret expiry, TTL, tags, or access history

## Workflow

### 1. Understand the landscape

Call `get_project_context` to get a redacted overview of existing secrets, scopes, manifest status, and recent activity.

### 2. CRUD operations

| Task | MCP Tool |
|------|----------|
| Store a secret | `set_secret` with optional `ttlSeconds`, `tags`, `description`, `env` (superposition), `rotationFormat` |
| Retrieve a secret | `get_secret` — collapses superposition automatically |
| Check existence | `has_secret` — never reveals the value |
| Delete a secret | `delete_secret` |
| List all secrets | `list_secrets` — filter with `tag`, `expired`, `stale`, `filter` |
| Inspect metadata | `inspect_secret` — shows decay, entanglement, access history (no value) |
| Usage / optimization | `analyze_secrets` — JSON report on secret usage patterns |

`get_secret`, `list_secrets`, and related tools return **JSON** text payloads (not raw unwrapped strings) for predictable agent parsing.

### 3. Import and export

- **Import**: `import_dotenv` to bulk-load from `.env` content
- **Export**: `export_secrets` with format `env` or `json`, optional key/tag filters

### 4. Superposition (multi-environment)

Store per-environment values with the `env` parameter on `set_secret`:
- `set_secret(key="DB_URL", value="...", env="dev")`
- `set_secret(key="DB_URL", value="...", env="prod")`
- `get_secret` collapses to the detected environment automatically

### 5. Entanglement

Link secrets so rotating one updates the other:
- `entangle_secrets(sourceKey, targetKey)` — bidirectional link
- `disentangle_secrets(sourceKey, targetKey)` — remove link

### 6. Scopes

Secrets resolve through a cascade: project → team → org → global. Use the `scope` parameter to target a specific level.

## Best practices

- Always add a `description` when storing secrets for discoverability
- Use `tags` to group related secrets (e.g., `database`, `api`, `auth`)
- Set `ttlSeconds` for credentials that expire (forces rotation awareness)
- Use `generate_secret` to create high-entropy values instead of inventing them
