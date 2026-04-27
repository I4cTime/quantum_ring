---
description: Initialize q-ring for the current project — detect environment, create manifest, import .env, set up hooks.
allowed-tools: mcp__q-ring__detect_environment, mcp__q-ring__check_project, mcp__q-ring__import_dotenv, mcp__q-ring__env_generate, mcp__q-ring__register_hook, mcp__q-ring__get_project_context, mcp__q-ring__list_hooks, Read, Write, Edit
---

# /qring-setup-project

Initialize q-ring for the current project with a manifest, environment detection, and secret import.

## Workflow

1. Call `detect_environment` to determine the current environment context (dev, staging, prod).
2. Check whether a `.q-ring.json` manifest already exists:
   - If yes, call `check_project` to validate it and report missing or expired secrets.
   - If no, guide the user through creating one.
3. Create a `.q-ring.json` manifest with:
   - `env` and `defaultEnv` set to the detected environment
   - `branchMap` mapping git branches to environments
   - `secrets` declaring required credentials with descriptions and providers
   - Optional `policy` section for governance
4. Check for existing `.env` files:
   - If found, offer to import via `import_dotenv` with `skipExisting: true`.
   - Verify `.env` is in `.gitignore`.
5. Call `env_generate` to produce a `.env` from the manifest.
6. Offer to register hooks via `register_hook`:
   - Shell hooks for restarting services on credential changes
   - HTTP hooks for deployment notifications
7. Summarize what was set up:
   - Manifest location and declared secrets
   - Imported secrets count
   - Registered hooks
   - Detected environment
