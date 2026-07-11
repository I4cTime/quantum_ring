#!/usr/bin/env bash
# q-ring · SessionStart hook
#
# When a Claude Code session starts in this project, inject a one-line note
# telling the agent to call `get_project_context` if a `.q-ring.json` manifest
# is detected in the workspace.
#
# Always exits 0; never blocks the session.

set -u

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

dir="${CLAUDE_PROJECT_DIR:-${PWD}}"

note="q-ring is wired into this project (see CLAUDE.md and .mcp.json). At the start of any secret-related task, call the \`get_project_context\` MCP tool for an up-to-date redacted view of secrets, environment, manifest, and policy. Available slash commands: /qring-scan-secrets, /qring-health-check, /qring-rotate-expired, /qring-setup-project, /qring-teleport-secrets, /qring-dashboard, /qring-exec-safe, /qring-analyze."

if [ -f "${dir}/.q-ring.json" ]; then
  note="${note}\n\nDetected \`.q-ring.json\` in the project root — the agent should call \`check_project\` to verify required secrets are present, and surface anything missing/expired/stale."
fi

jq -nc --arg n "$(printf %b "${note}")" '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: $n
  }
}'
