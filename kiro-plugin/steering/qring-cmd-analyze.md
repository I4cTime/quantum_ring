---
inclusion: manual
---

# q-ring · Analyze (command)

> Activate by typing `#qring-cmd-analyze` in chat.

Run q-ring secret usage / optimization analysis. Use when the user asks how secrets are used, which keys are stale, or for cleanup suggestions.

## Workflow

1. Call MCP tool `analyze_secrets` with the relevant `projectPath` / scope options.
2. Summarize the JSON: heavy keys, unused entries, decay risks, and concrete next steps.
