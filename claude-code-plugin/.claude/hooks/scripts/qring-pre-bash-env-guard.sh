#!/usr/bin/env bash
# q-ring · PreToolUse hook (Bash)
#
# Inspects the proposed shell command. If the command would print, stage, or
# commit a `.env` / `.env.*` file — or contains a credential-shaped literal —
# emit a permissionDecision=ask payload so the user is prompted to confirm.
#
# This hook never silently blocks; the worst it does is prompt for explicit
# approval. Required tools: jq.

set -u

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

payload="$(cat 2>/dev/null || true)"
if [ -z "${payload}" ]; then
  exit 0
fi

cmd="$(printf '%s' "${payload}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
if [ -z "${cmd}" ] || [ "${cmd}" = "null" ]; then
  exit 0
fi

reason=""

if echo "${cmd}" | grep -Eq '(^|[[:space:]])(cat|less|more|head|tail|bat)[[:space:]].*(\.env\b|\.env\.[A-Za-z0-9_.-]+)'; then
  reason="The command would print the contents of a .env file. Secrets in .env should be migrated into q-ring with the \`import_dotenv\` MCP tool first; printing the file leaks them into terminal history and agent transcripts."
fi

if [ -z "${reason}" ] && echo "${cmd}" | grep -Eq 'git[[:space:]]+(add|commit|push).*\.env(\b|\.[A-Za-z0-9_.-]+)'; then
  reason="The command would stage, commit, or push a .env file. Verify .env* is in .gitignore and migrate the secrets into q-ring with \`import_dotenv\` before continuing."
fi

if [ -z "${reason}" ] && echo "${cmd}" | grep -Eq '(sk-[A-Za-z0-9_-]{20,}|sk_(live|test)_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16})'; then
  reason="The command appears to contain a credential-shaped literal (looks like an OpenAI/Stripe/GitHub/AWS key). Run it via the \`exec_with_secrets\` MCP tool (or the \`/qring-exec-safe\` slash command) so the value comes from q-ring and stdout/stderr are redacted, instead of pasting it into shell history."
fi

if [ -n "${reason}" ]; then
  jq -nc --arg r "${reason}" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $r
    }
  }'
fi
