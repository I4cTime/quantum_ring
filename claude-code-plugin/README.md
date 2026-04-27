# q-ring Claude Code Plugin

Quantum keyring for AI agents — manage secrets, scan for leaks, rotate keys, and enforce policy directly from [Claude Code](https://docs.claude.com/en/docs/claude-code/overview).

This package mirrors the q-ring [Cursor plugin](../cursor-plugin/README.md) for Claude Code's native primitives: project [memory](https://docs.claude.com/en/docs/claude-code/memory) (`CLAUDE.md`), [subagents](https://docs.claude.com/en/docs/claude-code/sub-agents), [slash commands](https://docs.claude.com/en/docs/claude-code/slash-commands), [skills](https://docs.claude.com/en/docs/claude-code/skills), [hooks](https://docs.claude.com/en/docs/claude-code/hooks), and [project-scoped MCP](https://docs.claude.com/en/docs/claude-code/mcp).

## Prerequisites

Install the q-ring CLI and MCP server globally:

```bash
# pnpm (recommended)
pnpm add -g @i4ctime/q-ring

# npm
npm install -g @i4ctime/q-ring

# Homebrew
brew install i4ctime/tap/qring
```

Verify the MCP server is on `PATH`:

```bash
qring-mcp --help
```

## What's Included

### Project memory (`CLAUDE.md`)

Loaded into every Claude Code conversation in this project. Provides the always-on rules — never hardcode secrets, use q-ring for all operations, and warn about `.env` files. Equivalent to `cursor-plugin/rules/*.mdc`.

### MCP server (`.mcp.json`)

Project-scoped MCP config that connects Claude Code to the local `qring-mcp` binary over stdio. All 44 q-ring MCP tools become available in chat.

### Subagents (`.claude/agents/*.md`)

| Subagent | Purpose |
|----------|---------|
| `secret-ops` | Day-to-day secret operations — store, share, organize, generate |
| `security-auditor` | Proactive security monitoring — audit trails, anomalies, governance |

Invoke explicitly with `> Use the secret-ops subagent to store my OpenAI key` or let Claude Code delegate automatically based on the description.

### Slash commands (`.claude/commands/*.md`)

| Command | Action |
|---------|--------|
| `/qring-scan-secrets` | Scan codebase for hardcoded secrets, offer auto-fix |
| `/qring-health-check` | Full health report — decay, anomalies, audit integrity |
| `/qring-rotate-expired` | Find and rotate expired/stale credentials |
| `/qring-setup-project` | Initialize q-ring — manifest, imports, hooks |
| `/qring-teleport-secrets` | Encrypted cross-machine secret transfer |
| `/qring-dashboard` | Launch the live status dashboard (SSE + browser) |
| `/qring-exec-safe` | Run a command with secrets injected and stdout/stderr redacted |
| `/qring-analyze` | Usage analytics and optimization suggestions |

### Skills (`.claude/skills/*/SKILL.md`)

| Skill | Triggers On |
|-------|-------------|
| `secret-management` | Mentions of secrets, API keys, tokens, credentials, `.env` files |
| `secret-scanning` | Requests to scan, lint, audit, or find leaked credentials |
| `secret-rotation` | Expired keys, rotation, validation, CI checks |
| `project-onboarding` | New project setup, manifests, environment detection |
| `exec-with-secrets` | Running commands that need API keys without pasting them |

Skills are progressively disclosed — Claude Code reads only the metadata until a skill is relevant, then loads the full body.

### Hooks (`.claude/settings.json`)

| Event | Behavior |
|-------|----------|
| `PostToolUse` (`Write\|Edit\|MultiEdit`) | Log a reminder to lint the edited file with `lint_files` MCP tool |
| `PreToolUse` (`Bash`) | Block commands that look like they would commit / print `.env` files; warn about secret leakage |
| `SessionStart` | Print a one-line reminder to call `get_project_context` if a `.q-ring.json` is detected |

> Hook scripts live in `hooks/scripts/`. They are pure Bash with no runtime dependencies — safe to read before installing.

## Installation

### One-shot sync (recommended)

From the `quantum_ring` repo root:

```bash
pnpm install
pnpm run plugin:sync:claude
```

This copies into your project (`$PWD` by default):

- `claude-code-plugin/CLAUDE.md` → `./CLAUDE.md`
- `claude-code-plugin/.mcp.json` → `./.mcp.json`
- `claude-code-plugin/.claude/` → `./.claude/`

Pass a custom destination as the first argument:

```bash
pnpm run plugin:sync:claude -- /path/to/your/project
```

### User-level install

To install the agents, commands, skills, and hooks for **all** projects (instead of one project), copy into `~/.claude/`:

```bash
mkdir -p ~/.claude
cp -r claude-code-plugin/.claude/agents     ~/.claude/agents
cp -r claude-code-plugin/.claude/commands   ~/.claude/commands
cp -r claude-code-plugin/.claude/skills     ~/.claude/skills
cp    claude-code-plugin/.claude/settings.json ~/.claude/settings.json
```

Add the MCP server globally with the Claude Code CLI:

```bash
claude mcp add q-ring -- qring-mcp
```

> User-scoped commands are invoked the same way as project commands (e.g. `/qring-scan-secrets`); subagents are accessible from any project.

### Manual project install

```bash
cp -r claude-code-plugin/.claude    .
cp    claude-code-plugin/CLAUDE.md  CLAUDE.md
cp    claude-code-plugin/.mcp.json  .mcp.json
```

The first time you run `claude` in this project it will prompt you to approve the project-scoped MCP server defined in `.mcp.json`.

## Configuration

The plugin works out of the box. For project-specific behavior, create a `.q-ring.json` manifest in your project root:

```json
{
  "env": "dev",
  "defaultEnv": "dev",
  "branchMap": {
    "main": "prod",
    "develop": "dev"
  },
  "secrets": {
    "DATABASE_URL": { "required": true, "description": "PostgreSQL connection string" },
    "API_KEY": { "required": true, "provider": "openai" }
  }
}
```

Or run `/qring-setup-project` and let the agent walk you through it.

## License

AGPL-3.0-only — same as the [@i4ctime/q-ring](https://www.npmjs.com/package/@i4ctime/q-ring) npm package and [quantum_ring](https://github.com/I4cTime/quantum_ring) repository.
