---
inclusion: manual
---

# q-ring · Secret Scanning (skill)

> Activate by typing `#qring-secret-scanning` in chat.

Scan and lint codebases for hardcoded secrets using entropy analysis and regex heuristics.

## When to use

Activate when the user:
- Asks to scan a project for hardcoded secrets or credentials
- Wants to audit code before a commit or PR
- Needs to migrate hardcoded values from source files into q-ring
- Mentions "secret leak", "credential scan", or "lint for secrets"

## Workflow

### 1. Scan the codebase

Call `scan_codebase_for_secrets` with the project directory. The scanner uses:
- Regex heuristics matching common patterns (`api_key`, `secret`, `token`, `password`, etc.)
- Shannon entropy analysis (flags values with entropy > 3.5)
- Known prefix detection (`sk-`, `ghp_`, etc.)

It automatically skips `node_modules`, `.git`, binary files, lockfiles, and minified code.

### 2. Review findings

Each result includes:
- `file` and `line` — location
- `keyName` — the detected variable name
- `match` — the suspicious value
- `entropy` — Shannon entropy score
- `context` — the full line of code

Present findings grouped by file. Highlight high-entropy matches (> 4.0) as most likely to be real secrets.

### 3. Auto-fix with lint

Call `lint_files` with the list of affected files and `fix: true` to:
- Replace hardcoded values with `process.env.KEY` references (language-aware)
- Store the extracted values in q-ring automatically
- Support JS/TS, Python, Ruby, Go, Rust, Java, Kotlin, C#, PHP, and Shell

### 4. Verify cleanup

After fixing, re-run `scan_codebase_for_secrets` to confirm no secrets remain.

## Best practices

- Run scanning before every PR or commit
- Ignore placeholder values (`your_api_key`, `replace_me`, `example`) — the scanner handles this automatically
- For files with false positives, values under 8 characters or with low entropy are already filtered
