---
description: Run q-ring usage / optimization analysis — heavy keys, unused entries, decay risks.
allowed-tools: mcp__q-ring__analyze_secrets, mcp__q-ring__list_secrets
---

# /qring-analyze

Run q-ring's secret usage and optimization analysis. Use when the user asks how secrets are used, which keys are stale, or for cleanup suggestions.

## Workflow

1. Call MCP tool `analyze_secrets` with the relevant `projectPath` / scope options.
2. Summarize the JSON output: heavy keys, unused entries, decay risks, scope-optimization hints, and concrete next steps the user can take (e.g. delete unused keys, set TTL on keys without decay tracking, rotate stale credentials).
