<div align="center">
  <img src="https://unpkg.com/@i4ctime/q-ring@latest/assets/social-card-optimized.jpg" alt="q-ring logo" width="100%" />
</div>

# q-ring

**The first quantum-inspired keyring built specifically for AI coding agents.**

[![NPM Version](https://img.shields.io/npm/v/@i4ctime/q-ring?style=flat-square&color=0ea5e9)](https://www.npmjs.com/package/@i4ctime/q-ring)
[![Docs](https://img.shields.io/badge/docs-website-0ea5e9?style=flat-square)](https://qring.i4c.studio/docs)
[![MCP Tools](https://img.shields.io/badge/MCP_tools-44-0ea5e9?style=flat-square)](https://glama.ai/mcp/servers/I4cTime/quantum_ring)
[![License](https://img.shields.io/npm/l/@i4ctime/q-ring?style=flat-square&color=0ea5e9)](https://github.com/I4cTime/quantum_ring/blob/main/LICENSE)

<a href="https://glama.ai/mcp/servers/I4cTime/quantum_ring">
  <img src="https://glama.ai/mcp/servers/I4cTime/quantum_ring/badges/card.svg" alt="quantum_ring MCP server" width="400" />
</a>

Stop pasting API keys into plain-text `.env` files or wrestling with clunky secret managers. **q-ring** securely anchors your credentials to your OS's native vault (macOS Keychain, Linux Secret Service, Windows Credential Vault) and supercharges them with mechanics from quantum physics.

> 📖 **[View the Official Documentation](https://qring.i4c.studio/docs)** for a complete CLI reference, MCP prompt cookbooks, and architecture details.

### Why q-ring?
- **Superposition:** Store one key with multiple states (dev/staging/prod) that collapse based on context.
- **Entanglement:** Link keys across projects so rotating one automatically updates them all.
- **Tunneling:** Create ephemeral, in-memory secrets that self-destruct after a set time or read count.
- **Teleportation:** Securely pack and share AES-256-GCM encrypted secret bundles.
- **Seamless AI Integration:** 44 built-in MCP tools for native use in **Cursor**, **Kiro**, and **Claude Code**.

## 🚀 Installation

q-ring is designed to be installed globally so it's available anywhere in your terminal. Pick your favorite package manager:

```bash
# pnpm (recommended)
pnpm add -g @i4ctime/q-ring

# npm
npm install -g @i4ctime/q-ring

# yarn
yarn global add @i4ctime/q-ring

# Homebrew (macOS / Linux)
brew install i4ctime/tap/qring
```

## ⚡ Quick Start

```bash
# 1️⃣ Store a secret (prompts securely if value is omitted)
qring set OPENAI_API_KEY sk-...

# 2️⃣ Retrieve it anytime
qring get OPENAI_API_KEY

# 3️⃣ List all keys (values are never shown)
qring list

# 4️⃣ Generate a cryptographic secret and save it
qring generate --format api-key --prefix "sk-" --save MY_KEY

# 5️⃣ Run a full health scan
qring health
```

## Quantum Features

### Superposition — One Key, Multiple Environments

A single secret can hold different values for dev, staging, and prod simultaneously. The correct value resolves based on your current context.

```bash
# Set environment-specific values
qring set API_KEY "sk-dev-123" --env dev
qring set API_KEY "sk-stg-456" --env staging
qring set API_KEY "sk-prod-789" --env prod

# Value resolves based on context
QRING_ENV=prod qring get API_KEY   # → sk-prod-789
QRING_ENV=dev  qring get API_KEY   # → sk-dev-123

# Inspect the quantum state
qring inspect API_KEY
```

### Wavefunction Collapse — Smart Environment Detection

q-ring auto-detects your environment without explicit flags. Resolution order:

1. `--env` flag
2. `QRING_ENV` environment variable
3. `NODE_ENV` environment variable
4. Git branch heuristics (`main`/`master` → prod, `develop` → dev)
5. `.q-ring.json` project config
6. Default environment from the secret

```bash
# See what environment q-ring detects
qring env

# Project config (.q-ring.json)
echo '{"env": "staging", "branchMap": {"release/*": "staging"}}' > .q-ring.json
```

### Quantum Decay — Secrets with TTL

Secrets can have a time-to-live. Expired secrets are blocked from reads. Stale secrets (75%+ lifetime) trigger warnings.

```bash
# Set a secret that expires in 1 hour
qring set SESSION_TOKEN "tok-..." --ttl 3600

# Set with explicit expiry
qring set CERT_KEY "..." --expires "2026-06-01T00:00:00Z"

# Health check shows decay status
qring health
```

### Observer Effect — Audit Everything

Every secret read, write, and delete is logged with a tamper-evident hash chain. Access patterns are tracked for anomaly detection.

```bash
# View audit log
qring audit
qring audit --key OPENAI_KEY --limit 50

# Detect anomalies (burst access, unusual hours, chain tampering)
qring audit --anomalies

# Verify audit chain integrity
qring audit:verify

# Export audit log
qring audit:export --format json --since 2026-03-01
qring audit:export --format csv --output audit-report.csv
```

### Quantum Noise — Secret Generation

Generate cryptographically strong secrets in common formats.

```bash
qring generate                          # API key (default)
qring generate --format password -l 32  # Strong password
qring generate --format uuid            # UUID v4
qring generate --format token           # Base64url token
qring generate --format hex -l 64       # 64-byte hex
qring generate --format api-key --prefix "sk-live-" --save STRIPE_KEY
```

### Entanglement — Linked Secrets

Link secrets across projects. When you rotate one, all entangled copies update automatically.

```bash
# Entangle two secrets
qring entangle API_KEY API_KEY_BACKUP

# Now updating API_KEY also updates API_KEY_BACKUP
qring set API_KEY "new-value"

# Unlink entangled secrets
qring disentangle API_KEY API_KEY_BACKUP
```

### Tunneling — Ephemeral Secrets

Create secrets that exist only in memory. They never touch disk. Optional TTL and max-read self-destruction.

```bash
# Create an ephemeral secret (returns tunnel ID)
qring tunnel create "temporary-token-xyz" --ttl 300 --max-reads 1

# Read it (self-destructs after this read)
qring tunnel read tun_abc123

# List active tunnels
qring tunnel list
```

### Teleportation — Encrypted Sharing

Pack secrets into AES-256-GCM encrypted bundles for secure transfer between machines.

```bash
# Pack secrets (prompts for passphrase)
qring teleport pack --keys "API_KEY,DB_PASS" > bundle.txt

# On another machine: unpack (prompts for passphrase)
cat bundle.txt | qring teleport unpack

# Preview without importing
qring teleport unpack <bundle> --dry-run
```

### Import — Bulk Secret Ingestion

Import secrets from `.env` files directly into q-ring. Supports standard dotenv syntax including comments, quoted values, and escape sequences.

```bash
# Import all secrets from a .env file
qring import .env

# Import to project scope, skipping existing keys
qring import .env --project --skip-existing

# Preview what would be imported
qring import .env --dry-run
```

### Selective Export

Export only the secrets you need using key names or tag filters.

```bash
# Export specific keys
qring export --keys "API_KEY,DB_PASS,REDIS_URL"

# Export by tag
qring export --tags "backend"

# Combine with format
qring export --keys "API_KEY,DB_PASS" --format json
```

### Secret Search and Filtering

Filter `qring list` output by tag, expiry state, or key pattern.

```bash
# Filter by tag
qring list --tag backend

# Show only expired secrets
qring list --expired

# Show only stale secrets (75%+ decay)
qring list --stale

# Glob pattern on key name
qring list --filter "API_*"
```

### Project Secret Manifest

Declare required secrets in `.q-ring.json` and validate project readiness with a single command.

```bash
# Validate project secrets against the manifest
qring check

# See which secrets are present, missing, expired, or stale
qring check --project-path /path/to/project
```

### Env File Sync

Generate a `.env` file from the project manifest, resolving each key from q-ring with environment-aware superposition collapse.

```bash
# Generate to stdout
qring env:generate

# Write to a file
qring env:generate --output .env

# Force a specific environment
qring env:generate --env staging --output .env.staging
```

### Secret Liveness Validation

Test if a secret is actually valid with its target service. q-ring auto-detects the provider from key prefixes (`sk-` → OpenAI, `ghp_` → GitHub, etc.) or accepts an explicit provider name.

```bash
# Validate a single secret
qring validate OPENAI_API_KEY

# Force a specific provider
qring validate SOME_KEY --provider stripe

# Validate all secrets with detectable providers
qring validate --all

# Only validate manifest-declared secrets
qring validate --all --manifest

# List available providers
qring validate --list-providers
```

**Built-in providers:** OpenAI, Stripe, GitHub, AWS (format check), Generic HTTP.

Output:

```
  ✓ OPENAI_API_KEY   valid    (openai, 342ms)
  ✗ STRIPE_KEY       invalid  (stripe, 128ms) — API key has been revoked
  ⚠ AWS_ACCESS_KEY   error    (aws, 10002ms) — network timeout
  ○ DATABASE_URL     unknown  — no provider detected
```

### Hooks — Callbacks on Secret Change

Register webhooks, shell commands, or process signals that fire when secrets are created, updated, or deleted. Supports key matching, glob patterns, tag filtering, and scope constraints.

```bash
# Run a shell command when a secret changes
qring hook add --key DB_PASS --exec "docker restart app"

# POST to a webhook on any write/delete
qring hook add --key API_KEY --url "https://hooks.example.com/rotate"

# Trigger on all secrets tagged "backend"
qring hook add --tag backend --exec "pm2 restart all"

# Signal a process when DB secrets change
qring hook add --key-pattern "DB_*" --signal-target "node"

# List all hooks
qring hook list

# Remove a hook
qring hook remove <id>

# Enable/disable
qring hook enable <id>
qring hook disable <id>

# Dry-run test a hook
qring hook test <id>
```

Hooks are fire-and-forget: a failing hook never blocks secret operations. The hook registry is stored at `~/.config/q-ring/hooks.json`.

**SSRF protection:** HTTP hook URLs targeting private/loopback IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`) are blocked by default. DNS resolution is checked before the request is sent. To allow hooks targeting local services (e.g. during development), set the environment variable `Q_RING_ALLOW_PRIVATE_HOOKS=1`.

### Configurable Rotation

Set a rotation format per secret so the agent auto-rotates with the correct value shape.

```bash
# Store a secret with rotation format metadata
qring set STRIPE_KEY "sk-..." --rotation-format api-key --rotation-prefix "sk-"

# Store a password with password rotation format
qring set DB_PASS "..." --rotation-format password
```

### Secure Execution & Auto-Redaction

Run commands with secrets securely injected into the environment. All known secret values are automatically redacted from stdout and stderr to prevent leaking into terminal logs or agent transcripts. Exec profiles restrict which commands may be run.

```bash
# Execute a deployment script with secrets injected
qring exec -- npm run deploy

# Inject only specific tags
qring exec --tags backend -- node server.js

# Run with a restricted profile (blocks curl/wget/ssh, 30s timeout)
qring exec --profile restricted -- npm test
```

### Codebase Secret Scanner

Migrating a legacy codebase? Quickly scan directories for hardcoded credentials using regex heuristics and Shannon entropy analysis.

```bash
# Scan current directory
qring scan .
```

Output:
```
  ✗ src/db/connection.js:12
    Key:     DB_PASSWORD
    Entropy: 4.23
    Context: const DB_PASSWORD = "..."
```

### Composite / Templated Secrets

Store complex connection strings that dynamically resolve other secrets. If `DB_PASS` rotates, `DB_URL` is automatically correct without manual updates.

```bash
qring set DB_USER "admin"
qring set DB_PASS "supersecret"
qring set DB_URL "postgres://{{DB_USER}}:{{DB_PASS}}@localhost/mydb"

# Resolves embedded templates automatically
qring get DB_URL 
# Output: postgres://admin:supersecret@localhost/mydb
```

### User Approvals (Zero-Trust Agent)

Protect sensitive production secrets from being read autonomously by the MCP server without explicit user approval. Each approval token is HMAC-verified, scoped, reasoned, and time-limited.

```bash
# Mark a secret as requiring approval
qring set PROD_DB_URL "..." --requires-approval

# Temporarily grant MCP access for 1 hour with a reason
qring approve PROD_DB_URL --for 3600 --reason "deploying v2.0"

# List all approvals with verification status
qring approvals

# Revoke an approval
qring approve PROD_DB_URL --revoke
```

### Just-In-Time (JIT) Provisioning

Instead of storing static credentials, configure `q-ring` to dynamically generate short-lived tokens on the fly when requested (e.g. AWS STS, generic HTTP endpoints).

```bash
# Store the STS role configuration
qring set AWS_TEMP_KEYS '{"roleArn":"arn:aws:iam::123:role/AgentRole", "durationSeconds":3600}' --jit-provider aws-sts

# Resolving the secret automatically assumes the role and caches the temporary token
qring get AWS_TEMP_KEYS
```

### Project Context for AI Agents

A safe, redacted overview of the project's secrets, configuration, and state. Designed to be fed into an AI agent's system prompt without ever exposing secret values.

```bash
# Human-readable summary
qring context

# JSON output (for MCP / programmatic use)
qring context --json
```

### Secret-Aware Linter

Scan specific files for hardcoded secrets with optional auto-fix. When `--fix` is used, detected secrets are replaced with `process.env.KEY` references and stored in q-ring.

```bash
# Lint files for hardcoded secrets
qring lint src/config.ts src/db.ts

# Auto-fix: replace hardcoded values and store in q-ring
qring lint src/config.ts --fix

# Scan entire directory with auto-fix
qring scan . --fix
```

### Agent Memory

Encrypted, persistent key-value store that survives across AI agent sessions. Useful for remembering rotation history, project decisions, or context.

```bash
# Store a memory
qring remember last_rotation "Rotated STRIPE_KEY on 2026-03-21"

# Retrieve it
qring recall last_rotation

# List all memories
qring recall

# Forget
qring forget last_rotation
```

### Pre-Commit Secret Scanning

Install a git pre-commit hook that automatically blocks commits containing hardcoded secrets.

```bash
# Install the hook
qring hook:install

# Uninstall
qring hook:uninstall
```

### Secret Analytics

Analyze usage patterns and get optimization suggestions for your secrets.

```bash
qring analyze
```

Output includes most accessed secrets, unused/stale secrets, scope optimization suggestions, and rotation recommendations.

### Service Setup Wizard

Quickly set up a new service integration with secrets, manifest entries, and hooks in one command.

```bash
# Create secrets for a new Stripe integration
qring wizard stripe --keys STRIPE_KEY,STRIPE_SECRET --provider stripe --tags payment

# With a hook to restart the app on change
qring wizard myservice --hook-exec "pm2 restart app"
```

### Governance Policy

Define project-level governance rules in `.q-ring.json` to control which MCP tools can be used, which keys are accessible, and which commands can be executed. Policy is enforced at both the MCP server and keyring level.

```bash
# View the active policy
qring policy

# JSON output
qring policy --json
```

Example policy in `.q-ring.json`:

```json
{
  "policy": {
    "mcp": {
      "denyTools": ["delete_secret"],
      "deniedKeys": ["PROD_DB_PASSWORD"],
      "deniedTags": ["production"]
    },
    "exec": {
      "denyCommands": ["curl", "wget", "ssh"],
      "maxRuntimeSeconds": 30
    },
    "secrets": {
      "requireApprovalForTags": ["production"],
      "maxTtlSeconds": 86400
    }
  }
}
```

### Exec Profiles

Restrict command execution with named profiles that control allowed commands, network access, timeouts, and environment sanitization.

```bash
# Run with the "restricted" profile (blocks curl, wget, ssh; 30s timeout)
qring exec --profile restricted -- npm test

# Run with the "ci" profile (5min timeout, allows network)
qring exec --profile ci -- npm run deploy

# Default: unrestricted
qring exec -- echo "hello"
```

**Built-in profiles:** `unrestricted`, `restricted` (no network tools, 30s limit), `ci` (5min limit, blocks destructive commands).

### Tamper-Evident Audit

Every audit event includes a SHA-256 hash of the previous event, creating a tamper-evident chain. Verify integrity and export logs in multiple formats.

```bash
# Verify the entire audit chain
qring audit:verify

# Export as JSON
qring audit:export --format json --since 2026-03-01

# Export as CSV
qring audit:export --format csv --output audit-report.csv
```

### Team & Org Scopes

Extend beyond `global` and `project` scopes with `team` and `org` scopes for shared secrets across groups. Resolution order: project → team → org → global (most specific wins).

```bash
# Store a secret in team scope
qring set SHARED_API_KEY "sk-..." --team my-team

# Store in org scope
qring set ORG_LICENSE "lic-..." --org acme-corp

# Resolution cascades: project > team > org > global
qring get API_KEY --team my-team --org acme-corp
```

### Issuer-Native Rotation

Attempt provider-native secret rotation (for providers that support it) or fall back to local generation.

```bash
# Rotate via the detected provider
qring rotate STRIPE_KEY

# Force a specific provider
qring rotate API_KEY --provider openai
```

### CI Secret Validation

Batch-validate all secrets against their providers in a CI-friendly mode. Returns a structured pass/fail report with exit code 1 on failure.

```bash
# Validate all secrets (CI mode)
qring ci:validate

# JSON output for pipeline parsing
qring ci:validate --json
```

### Agent Mode — Autonomous Monitoring

A background daemon that continuously monitors secret health, detects anomalies, and optionally auto-rotates expired secrets.

```bash
# Start the agent
qring agent --interval 60 --verbose

# With auto-rotation of expired secrets
qring agent --auto-rotate

# Single scan (for CI/cron)
qring agent --once
```

### Quantum Status Dashboard — Live Monitoring

Launch a real-time dashboard in your browser that visualizes every quantum subsystem at a glance: health summary, decay timers, superposition states, entanglement pairs, active tunnels, anomaly alerts, audit log, and environment detection.

The dashboard is a self-contained HTML page served locally. Data streams in via Server-Sent Events and updates every 5 seconds — no dependencies, no cloud, no config.

```bash
# Open the dashboard (auto-launches your browser)
qring status

# Specify a custom port
qring status --port 4200

# Don't auto-open the browser
qring status --no-open
```

## MCP Server

q-ring includes a full MCP server with 44 tools for AI agent integration.

### Core Tools

| Tool | Description |
|------|-------------|
| `get_secret` | Retrieve with superposition collapse + observer logging |
| `list_secrets` | List keys with quantum metadata, filterable by tag/expiry/pattern |
| `set_secret` | Store with optional TTL, env state, tags, rotation format |
| `delete_secret` | Remove a secret |
| `has_secret` | Boolean check (respects decay) |
| `export_secrets` | Export as .env/JSON with optional key and tag filters |
| `import_dotenv` | Parse and import secrets from .env content |
| `check_project` | Validate project secrets against `.q-ring.json` manifest |
| `env_generate` | Generate .env content from the project manifest |

### Quantum Tools

| Tool | Description |
|------|-------------|
| `inspect_secret` | Full quantum state (states, decay, entanglement, access count) |
| `detect_environment` | Wavefunction collapse — detect current env context |
| `generate_secret` | Quantum noise — generate and optionally save secrets |
| `entangle_secrets` | Link two secrets for synchronized rotation |
| `disentangle_secrets` | Remove entanglement between two secrets |

### Tunneling Tools

| Tool | Description |
|------|-------------|
| `tunnel_create` | Create ephemeral in-memory secret |
| `tunnel_read` | Read (may self-destruct) |
| `tunnel_list` | List active tunnels |
| `tunnel_destroy` | Immediately destroy |

### Teleportation Tools

| Tool | Description |
|------|-------------|
| `teleport_pack` | Encrypt secrets into a portable bundle |
| `teleport_unpack` | Decrypt and import a bundle |

### Validation Tools

| Tool | Description |
|------|-------------|
| `validate_secret` | Test if a secret is valid with its target service (OpenAI, Stripe, GitHub, etc.) |
| `list_providers` | List all available validation providers |

### Hook Tools

| Tool | Description |
|------|-------------|
| `register_hook` | Register a shell/HTTP/signal callback on secret changes |
| `list_hooks` | List all registered hooks with match criteria and status |
| `remove_hook` | Remove a registered hook by ID |

### Execution & Scanning Tools

| Tool | Description |
|------|-------------|
| `exec_with_secrets` | Run a shell command securely with secrets injected, auto-redacted output, and exec profile enforcement |
| `scan_codebase_for_secrets` | Scan a directory for hardcoded secrets using regex heuristics and entropy analysis |
| `lint_files` | Lint specific files for hardcoded secrets with optional auto-fix |

### AI Agent Tools

| Tool | Description |
|------|-------------|
| `get_project_context` | Safe, redacted overview of project secrets, environment, manifest, and activity |
| `agent_remember` | Store a key-value pair in encrypted agent memory (persists across sessions) |
| `agent_recall` | Retrieve from agent memory, or list all stored keys |
| `agent_forget` | Delete a key from agent memory |
| `analyze_secrets` | Usage analytics: most accessed, stale, unused, and rotation recommendations |

### Observer & Health Tools

| Tool | Description |
|------|-------------|
| `audit_log` | Query access history |
| `detect_anomalies` | Scan for unusual access patterns |
| `verify_audit_chain` | Verify tamper-evident hash chain integrity |
| `export_audit` | Export audit events in jsonl, json, or csv format |
| `health_check` | Full health report |
| `status_dashboard` | Launch the quantum status dashboard via MCP |
| `agent_scan` | Run autonomous agent scan |

### Governance & Policy Tools

| Tool | Description |
|------|-------------|
| `check_policy` | Check if an action (tool use, key read, exec) is allowed by project policy |
| `get_policy_summary` | Get a summary of the project's governance policy configuration |
| `rotate_secret` | Attempt issuer-native rotation via detected or specified provider |
| `ci_validate_secrets` | CI-oriented batch validation of all secrets with structured pass/fail report |

### Cursor / Kiro Configuration

Add to `.cursor/mcp.json` or `.kiro/mcp.json`:

**If q-ring is installed globally** (e.g. `pnpm add -g @i4ctime/q-ring`):

```json
{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}
```

**If using a local clone:**

```json
{
  "mcpServers": {
    "q-ring": {
      "command": "node",
      "args": ["/path/to/quantum_ring/dist/mcp.js"]
    }
  }
}
```

### Claude Code Configuration

Add to `~/.claude/claude_desktop_config.json`:

**Global install:**

```json
{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}
```

**Local clone:**

```json
{
  "mcpServers": {
    "q-ring": {
      "command": "node",
      "args": ["/path/to/quantum_ring/dist/mcp.js"]
    }
  }
}
```

## Cursor Plugin

The **q-ring Cursor Plugin** brings quantum secret management directly into your IDE with rules, skills, agents, commands, hooks, and a built-in MCP connector.

| Component | What it does |
|-----------|-------------|
| **3 Rules** | Always-on guidance: never hardcode secrets, use q-ring for all ops, warn about `.env` files |
| **4 Skills** | Auto-triggered by context: secret management, scanning, rotation, project onboarding |
| **2 Agents** | `security-auditor` (proactive monitoring) and `secret-ops` (day-to-day assistant) |
| **5 Commands** | `/qring:scan-secrets`, `/qring:health-check`, `/qring:rotate-expired`, `/qring:setup-project`, `/qring:teleport-secrets` |
| **2 Hooks** | `afterFileEdit` (lint scan), `sessionStart` (project context) |
| **MCP Connector** | Auto-connects to `qring-mcp` via stdio — all 44 tools available |

Install from the Cursor marketplace or see [`cursor-plugin/README.md`](cursor-plugin/README.md) for manual setup.

## Architecture

```
qring CLI ─────┐
               ├──▶ Core Engine ──▶ @napi-rs/keyring ──▶ OS Keyring
MCP Server ────┘       │
                       ├── Envelope (quantum metadata)
                       ├── Scope Resolver (global / project / team / org)
                       ├── Collapse (env detection + branchMap globs)
                       ├── Observer (tamper-evident audit chain)
                       ├── Policy (governance-as-code engine)
                       ├── Noise (secret generation)
                       ├── Entanglement (cross-secret linking)
                       ├── Validate (provider-based liveness + rotation)
                       ├── Hooks (shell/HTTP/signal callbacks)
                       ├── Import (.env file ingestion)
                       ├── Exec (profile-restricted injection + redaction)
                       ├── Scan (codebase entropy heuristics)
                       ├── Provision (JIT ephemeral credentials)
                       ├── Approval (HMAC-verified zero-trust tokens)
                       ├── Context (safe redacted project view)
                       ├── Linter (secret-aware code scanning)
                       ├── Memory (encrypted agent persistence)
                       ├── Tunnel (ephemeral in-memory)
                       ├── Teleport (encrypted sharing)
                       ├── Agent (autonomous monitor + rotation)
                       └── Dashboard (live status via SSE)
```

## Project Config (`.q-ring.json`)

Optional per-project configuration:

```json
{
  "env": "dev",
  "defaultEnv": "dev",
  "branchMap": {
    "main": "prod",
    "develop": "dev",
    "staging": "staging",
    "release/*": "staging",
    "feature/*": "dev"
  },
  "secrets": {
    "OPENAI_API_KEY": { "required": true, "description": "OpenAI API key", "format": "api-key", "prefix": "sk-", "provider": "openai" },
    "DATABASE_URL": { "required": true, "description": "Postgres connection string", "validationUrl": "https://api.example.com/health" },
    "SENTRY_DSN": { "required": false, "description": "Sentry error tracking" }
  },
  "policy": {
    "mcp": {
      "denyTools": ["delete_secret"],
      "deniedKeys": ["PROD_DB_PASSWORD"],
      "deniedTags": ["production"]
    },
    "exec": {
      "denyCommands": ["curl", "wget"],
      "maxRuntimeSeconds": 60
    }
  }
}
```

- **`branchMap`** supports glob patterns with `*` wildcards (e.g., `release/*` matches `release/v1.0`)
- **`secrets`** declares the project's required secrets — use `qring check` to validate, `qring env:generate` to produce a `.env` file
- **`provider`** associates a liveness validation provider with a secret (e.g., `"openai"`, `"stripe"`, `"github"`) — use `qring validate` to test
- **`validationUrl`** configures the generic HTTP provider's endpoint for custom validation
- **`policy`** defines governance rules for MCP tool gating, key access restrictions, exec allowlists, and secret lifecycle requirements

## Contributing

- Run **`pnpm run lint`**, **`pnpm run typecheck`**, and **`pnpm run test:ci`** before opening a PR.
- Tests or sandboxes can point the audit log elsewhere with **`QRING_AUDIT_DIR`** (directory is created if missing); default is `~/.config/q-ring/audit.jsonl`.
- Optional local pre-commit: **`qring hook:install`** (uses this package’s `precommit` hook when `qring` is on your `PATH`).
- After changing the Cursor plugin under **`cursor-plugin/`**, run **`pnpm run plugin:sync`** to copy it to `~/.cursor/plugins/local/my-plugin` (or pass a custom path). See also [docs/cli-mcp-parity.md](docs/cli-mcp-parity.md).

## 📜 License

[AGPL-3.0](LICENSE) - Free to use, modify, and share. Any derivative work or hosted service must release its source code under the same license.
