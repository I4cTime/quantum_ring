#!/usr/bin/env bash
# q-ring · PostToolUse hook (Write/Edit/MultiEdit)
#
# Reads the Claude Code hook payload from stdin, extracts the edited file path
# (tool_input.file_path), and emits a non-blocking JSON instruction telling the
# agent to lint that file with the q-ring `lint_files` MCP tool.
#
# It never blocks the edit: even when q-ring or jq is missing, the hook exits 0
# and prints nothing.

set -u

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

payload="$(cat 2>/dev/null || true)"
if [ -z "${payload}" ]; then
  exit 0
fi

file_path="$(printf '%s' "${payload}" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
if [ -z "${file_path}" ] || [ "${file_path}" = "null" ]; then
  exit 0
fi

case "${file_path}" in
  *node_modules/*|*.git/*|*dist/*|*build/*|*coverage/*|*/.next/*|*/.venv/*|*/__pycache__/*)
    exit 0 ;;
  *.lock|*.lockb|*.pyc|*.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.svg|*.pdf|*.zip|*.tgz|*.tar|*.gz|*.mp3|*.mp4|*.mov|*.wav|*.bin|*.exe|*.dll|*.so|*.dylib)
    exit 0 ;;
esac

reason="The agent edited ${file_path}. Call the q-ring MCP tool \`lint_files\` for this single path. If hardcoded secrets are reported, summarize them concisely and ask whether to call \`lint_files\` again with \`fix: true\` to migrate the values into q-ring (replacing literal values with \`process.env.KEY\` style references)."

jq -nc --arg r "${reason}" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $r
  }
}'
