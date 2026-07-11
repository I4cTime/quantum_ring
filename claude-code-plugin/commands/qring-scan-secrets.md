---
description: Scan the workspace for hardcoded secrets, then offer to auto-fix them with q-ring.
argument-hint: "[path]"
allowed-tools: mcp__q-ring__scan_codebase_for_secrets, mcp__q-ring__lint_files, mcp__q-ring__list_secrets
---

# /qring-scan-secrets

Scan the current workspace (or `$1` if provided) for hardcoded secrets, API keys, and credentials.

## Workflow

1. Call `scan_codebase_for_secrets` with the target directory (`$1` if provided, otherwise the workspace root).
2. If no secrets are found, report that the codebase is clean and stop.
3. If secrets are found, present them grouped by file:
   - Show file path, line number, variable name, and entropy score
   - Highlight high-entropy matches (> 4.0) as most likely real
4. Ask the user if they want to auto-fix:
   - On yes, call `lint_files` with the affected files and `fix: true`
   - This replaces hardcoded values with `process.env.KEY` references and stores the values in q-ring
   - Report how many secrets were migrated
5. After fixing, re-run `scan_codebase_for_secrets` to confirm cleanup is complete.
