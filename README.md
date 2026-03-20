<div align="center">
  <img src="https://unpkg.com/@i4ctime/q-ring@latest/assets/social-card-optimized.jpg" alt="q-ring logo" width="100%" />
</div>

# q-ring

**The first quantum-inspired keyring built specifically for AI coding agents.**

Stop pasting API keys into plain-text `.env` files or struggling with clunky secret managers. **q-ring** securely anchors your credentials to your OS's native vault (macOS Keychain, GNOME Keyring, Windows Credential Manager), then supercharges them with mechanics from quantum physics. 

Experience **superposition** (multi-environment keys), **entanglement** (linked rotations), **tunneling** (in-memory ephemerality), and **teleportation** (encrypted sharing). 

Seamlessly integrated with **Cursor**, **Kiro**, **Claude Code**, and the entire **MCP** ecosystem.

[![qring-mcp MCP server](https://glama.ai/mcp/servers/I4cTime/quantum_ring/badges/card.svg)](https://glama.ai/mcp/servers/I4cTime/quantum_ring)

## 🚀 Installation

q-ring is designed to be installed globally so it's available anywhere in your terminal. Pick your favorite package manager:

```bash
# npm
npm install -g @i4ctime/q-ring

# pnpm (recommended)
pnpm add -g @i4ctime/q-ring

# yarn
yarn global add @i4ctime/q-ring
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

Every secret read, write, and delete is logged. Access patterns are tracked for anomaly detection.

```bash
# View audit log
qring audit
qring audit --key OPENAI_KEY --limit 50

# Detect anomalies (burst access, unusual hours)
qring audit --anomalies
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

## MCP Server

q-ring includes a full MCP server with 20 tools for AI agent integration.

### Core Tools

| Tool | Description |
|------|-------------|
| `get_secret` | Retrieve with superposition collapse + observer logging |
| `list_secrets` | List keys with quantum metadata (never exposes values) |
| `set_secret` | Store with optional TTL, env state, tags |
| `delete_secret` | Remove a secret |
| `has_secret` | Boolean check (respects decay) |

### Quantum Tools

| Tool | Description |
|------|-------------|
| `inspect_secret` | Full quantum state (states, decay, entanglement, access count) |
| `detect_environment` | Wavefunction collapse — detect current env context |
| `generate_secret` | Quantum noise — generate and optionally save secrets |
| `entangle_secrets` | Link two secrets for synchronized rotation |

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

### Observer & Health Tools

| Tool | Description |
|------|-------------|
| `audit_log` | Query access history |
| `detect_anomalies` | Scan for unusual access patterns |
| `health_check` | Full health report |
| `agent_scan` | Run autonomous agent scan |

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

## Architecture

```
qring CLI ─────┐
               ├──▶ Core Engine ──▶ @napi-rs/keyring ──▶ OS Keyring
MCP Server ────┘       │
                       ├── Envelope (quantum metadata)
                       ├── Scope Resolver (global / project)
                       ├── Collapse (env detection)
                       ├── Observer (audit log)
                       ├── Noise (secret generation)
                       ├── Entanglement (cross-secret linking)
                       ├── Tunnel (ephemeral in-memory)
                       ├── Teleport (encrypted sharing)
                       └── Agent (autonomous monitor)
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
    "staging": "staging"
  }
}
```

## 📜 License

[AGPL-3.0](LICENSE) - Free to use, modify, and share. Any derivative work or hosted service must release its source code under the same license.
