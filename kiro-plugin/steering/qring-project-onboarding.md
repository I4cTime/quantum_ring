---
inclusion: manual
---

# q-ring · Project Onboarding (skill)

> Activate by typing `#qring-project-onboarding` in chat.

Set up q-ring for a new project — create manifests, detect environments, import secrets, configure hooks and policy.

## When to use

Activate when the user:
- Starts a new project and needs secret management
- Asks about `.q-ring.json` configuration
- Wants to detect or configure environments
- Needs to set up hooks for secret change notifications
- Asks about governance policy

## Workflow

### 1. Detect environment

Call `detect_environment` to determine the current context. Sources checked in order:
1. Explicit `QRING_ENV`
2. `NODE_ENV` (mapped: `production` → `prod`, `development` → `dev`)
3. Git branch + `.q-ring.json` `branchMap` (supports globs like `release/*`)
4. `.q-ring.json` `defaultEnv`

### 2. Check existing state

Call `check_project` to validate against any existing `.q-ring.json` manifest. This reports:
- Required secrets that are present, missing, expired, or stale
- Overall project readiness

### 3. Create or update the manifest

Help the user create a `.q-ring.json` file with:

```json
{
  "env": "dev",
  "defaultEnv": "dev",
  "branchMap": {
    "main": "prod",
    "develop": "dev",
    "release/*": "staging"
  },
  "secrets": {
    "DATABASE_URL": { "required": true, "description": "PostgreSQL connection string" },
    "API_KEY": { "required": true, "provider": "openai", "description": "OpenAI API key" }
  },
  "policy": {
    "mcp": { "denyTools": ["exec_with_secrets"] },
    "secrets": { "maxTtlSeconds": 2592000 }
  }
}
```

### 4. Import existing secrets

If the project has `.env` files, offer to import them with `import_dotenv`. Use `skipExisting: true` to avoid overwriting.

### 5. Generate `.env` from manifest

Call `env_generate` to produce a `.env` file from the manifest with all declared secrets resolved from q-ring.

### 6. Set up hooks

Call `register_hook` to set up notifications when secrets change:
- Shell hook: restart dev server on DB credential change
- HTTP hook: notify a deployment webhook
- Signal hook: send SIGHUP to a running process

Use `list_hooks` to inspect the registry and `remove_hook` to delete entries by id. (CLI-only: `qring hook enable|disable|test` for lifecycle control.)

### 7. Configure policy

Guide the user through the `policy` section of `.q-ring.json`:
- **mcp**: `allowTools` / `denyTools`, `readableKeys` / `deniedKeys`, `deniedTags`
- **exec**: `allowCommands` / `denyCommands`, `maxRuntimeSeconds`, `allowNetwork`
- **secrets**: `requireApprovalForTags`, `maxTtlSeconds`

Call `get_policy_summary` to verify the policy is loaded correctly.

## Best practices

- Always create a `.q-ring.json` manifest for team projects — it serves as documentation and validation
- Use `branchMap` to automatically detect environments from git branches
- Set `required: true` on critical secrets so `check_project` catches missing credentials
