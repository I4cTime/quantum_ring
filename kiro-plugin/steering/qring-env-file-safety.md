---
inclusion: fileMatch
fileMatchPattern: "**/.env*"
---

# q-ring · .env File Safety

This steering activates whenever a `.env`, `.env.local`, `.env.production`, etc. file is in context.

When a `.env` file is open or being edited:

1. **Suggest importing.** Offer to call `import_dotenv` to migrate all key-value pairs into q-ring where they are encrypted in the OS keychain.
2. **Check `.gitignore`.** Verify that `.env*` patterns are in `.gitignore`. If not, warn the user immediately and offer to add them.
3. **Prefer manifest-driven generation.** If the project has a `.q-ring.json` manifest, suggest using `env_generate` to produce `.env` files on-demand from q-ring instead of maintaining them by hand.
4. **Never add new secrets** to `.env` files directly. Use `set_secret` (or `qring set KEY value`) and then `env_generate` to produce the file.
5. **Lint on save.** If the `qring-scan-on-save` agent hook is installed, the file will be automatically scanned. Otherwise, offer to call `lint_files` with the affected paths.
