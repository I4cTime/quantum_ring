---
name: scan-secrets
description: Scan the current project for hardcoded secrets and offer to auto-fix them.
---

# Scan Secrets

Scan the current workspace for hardcoded secrets, API keys, and credentials.

## Usage

Invoke via `/qring:scan-secrets`

## Workflow

1. Call `scan_codebase_for_secrets` with the current workspace root directory.

2. If no secrets are found, report that the codebase is clean.

3. If secrets are found, present them grouped by file:
   - Show file path, line number, variable name, and entropy score
   - Highlight high-entropy matches (> 4.0) as most likely real

4. Ask the user if they want to auto-fix:
   - If yes, call `lint_files` with the affected files and `fix: true`
   - This replaces hardcoded values with `process.env.KEY` references and stores the values in q-ring
   - Report how many secrets were migrated

5. After fixing, re-run `scan_codebase_for_secrets` to confirm cleanup is complete.
