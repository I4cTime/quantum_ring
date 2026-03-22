# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] — 2026-03-22

### Added
- **Secret Liveness Validation** — `qring validate` tests if a secret is actually valid with its target service. Built-in providers for OpenAI, Stripe, GitHub, AWS, and Generic HTTP with auto-detection from key prefixes. MCP tools: `validate_secret`, `list_providers`.
- **Hooks on Secret Change** — register shell commands, HTTP webhooks, or process signals that fire when secrets are written, deleted, or rotated. CLI: `qring hook add/list/remove/enable/disable/test`. MCP tools: `register_hook`, `list_hooks`, `remove_hook`.
- **`.env` file import** — `qring import .env` parses dotenv syntax and bulk-stores secrets. MCP tool: `import_dotenv`.
- **Project Secret Manifest** — declare required secrets in `.q-ring.json` and validate with `qring check`. MCP tool: `check_project`.
- **Env File Sync** — `qring env:generate` produces a `.env` from the project manifest. MCP tool: `env_generate`.
- **Disentangle command** — `qring disentangle` exposes the existing core function to CLI and MCP.
- **Selective Export** — `qring export --keys` and `--tags` filter which secrets are exported. Same filters on MCP `export_secrets`.
- **branchMap glob support** — `.q-ring.json` branchMap now supports `*` wildcards (e.g. `release/*`).
- **Configurable rotation** — `--rotation-format` and `--rotation-prefix` on `qring set` control auto-rotation shape.
- **Secret search/filtering** — `qring list --tag`, `--expired`, `--stale`, `--filter` flags.
- **Provider metadata** — `provider` field on `SecretMetadata` and `ManifestEntry` for validation auto-detection.

### Changed
- MCP server tool count increased from 20 to 31.
- Architecture expanded with Validate, Hooks, and Import subsystems.

## [0.3.2] — 2026-03-21

### Security
- Resolved 8 CodeQL `js/clear-text-logging` alerts by sanitizing keyring metadata before CLI output.

## [0.3.1] — 2026-03-21

### Fixed
- **Dashboard re-rendering** — Cards are now created once and updated in-place via differential DOM patching. No more flickering or re-animation on every SSE tick.
- **Audit log noise** — `qring list` calls from the dashboard no longer generate audit entries (silent mode) and `list` events are filtered from the dashboard feed.

### Changed
- **Increased dashboard font sizes** — Base font bumped from 14px to 16px; all panel text sizes proportionally increased for readability.
- **Header icon** — Replaced inline SVG with the project icon from gh-pages (`icon.png`).
- **README** — Added Quantum Status Dashboard section with CLI usage and flags; added Dashboard to architecture diagram.

## [0.3.0] — 2026-03-21

### Added
- **Quantum Status Dashboard** — `qring status` launches a local browser dashboard with live SSE updates showing health summary, decay timers, superposition states, entanglement graph, active tunnels, audit log, anomaly alerts, and environment detection.
- **MCP `status_dashboard` tool** — AI agents can start the dashboard server and return the URL.
- **MCP Registry support** — `server.json` and `mcpName` field for publishing to `registry.modelcontextprotocol.io`.
- **GitHub issue templates** — bug report and feature request forms.
- **SECURITY.md** — vulnerability disclosure policy.

### Changed
- Fixed shebang (`#!/usr/bin/env node`) now present on both `dist/index.js` and `dist/mcp.js`.
- Corrected `bin` paths in `package.json` per npm standards.

## [0.2.9] — 2026-03-21

### Changed
- Added `mcpName` field to `package.json` for MCP Registry compatibility.
- Fixed `tsup.config.ts` to add shebang to `dist/mcp.js`.

## [0.2.7] — 2026-03-20

### Added
- Initial public release with quantum keyring core, MCP server (20 tools), and CLI.
- Superposition, entanglement, tunneling, teleportation, decay, observer, and agent features.
- GitHub Pages landing site.
- Glama integration with `glama.json` and Dockerfile.
