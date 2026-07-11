# Quickstart: q-ring in Kiro

## 1. Install the CLI (once per machine)

```bash
pnpm add -g @i4ctime/q-ring     # or: npm i -g / brew install i4ctime/tap/qring
qring doctor                    # verify keyring backend + qring-mcp on PATH
```

## 2. Install the Power

Preferred: add `kiro-plugin/` from a checkout of this repo as a **Power** via Kiro's Powers panel ([docs](https://kiro.dev/docs/powers/create/)) — it reads `POWER.md` and wires `mcp.json`, steering, and hooks.

Or copy into your Kiro config directly:

```bash
pnpm install
pnpm run plugin:sync:kiro       # mcp.json → ~/.kiro/settings, plus steering/ and hooks/
```

Kiro's `mcp.json` ships an `autoApprove` allowlist for the read-only tools, so status/context calls don't prompt.

## 3. First five minutes

```bash
qring set OPENAI_API_KEY        # value prompted, masked
```

Steering docs activate on demand with `#` tags in chat:

| Type | What you get |
|---|---|
| `#qring-secret-management` | Store/retrieve/organize workflow guidance + live tools |
| `#qring-secret-scanning` then "scan this repo" | Hardcoded-secret scan with auto-fix |
| `#qring-cmd-health-check` | Full health report — decay, anomalies, audit integrity |
| `#qring-exec-with-secrets` then "run the tests" | `exec_with_secrets` with redacted output |
| `#qring-cmd-dashboard` | Live localhost dashboard |

The three hooks watch file writes and shell commands for `.env`/credential leaks.

## Troubleshooting

MCP server not connecting, keyring errors → [troubleshooting.md](troubleshooting.md). Full Power reference → [kiro-plugin/README.md](../kiro-plugin/README.md).
