# Changelog

All notable changes to this project will be documented in this file.

## [0.9.5] — 2026-03-26

### Added
- **Cursor marketplace plugin** — `cursor-plugin/` with 3 rules, 4 skills, 2 agents, 5 commands, 2 hooks, MCP connector, and marketplace manifest. Surfaces all 44 MCP tools through IDE-native components.
- **Marketplace discovery** — `.cursor-plugin/marketplace.json` at repo root for monorepo-based plugin resolution.
- **Web: Cursor Plugin section** — homepage component with animated cards for all plugin components.
- **Web: Plugin nav link** — "Plugin" added to site navigation.
- **Web: Homebrew install tabs** — Homebrew option added to Hero and docs install commands.
- **README: Cursor Plugin section** — table summarizing all plugin components with marketplace install instructions.
- **README: Homebrew install** — `brew install i4ctime/tap/qring` added to Installation section.

### Changed
- **Web: docs page** — Step 4 added for Cursor Plugin with component grid and manual install terminal.
- **Web: Footer** — version updated from v0.9.1 to v0.9.4.

### Fixed
- **beforeShellExecution hook removed** — Cursor injects base64 metadata into hook commands, causing a circular block. Shell command warnings moved to the `secret-hygiene` rule instead.

### Security
- **picomatch >=4.0.4** — pnpm override added to resolve ReDoS vulnerability (GHSA-c2c7-rcm5-vvqj) and method injection (GHSA-3v7f-55p6-f55p) in `tsup > tinyglobby > picomatch`.

## [0.9.4] — 2026-03-25

### Added
- **Vitest test suite** — 125 tests across 17 files covering core modules (noise, envelope, tunnel, teleport, entanglement, scan, linter, memory, hooks, approval, observer, policy, collapse, scope), CLI command registration, and MCP tool registration (all 44 tools verified).
- **CI test step** — `pnpm run test:ci` added to `ci.yml` workflow after the build step.
- **Homebrew tap** — `I4cTime/homebrew-tap` repo with `Formula/qring.rb` for `brew tap I4cTime/tap && brew install qring`.
- **Homebrew auto-update workflow** — `update-homebrew.yml` triggers on release, waits for npm availability, computes sha256, and pushes the updated formula automatically.

## [0.9.3] — 2026-03-25

### Changed
- **Custom domain** — site now served at `qring.i4c.studio` instead of `i4ctime.github.io/quantum_ring`. Removed `basePath`, updated all asset paths and metadata.
- **Funding** — Ko-fi slug updated to `i4ctime`.
- **Favicon** — icon metadata added to layout for branded browser/Apple touch icons.
- **Deploy workflow** — CNAME file persists across `gh-pages` deploys.

## [0.9.2] — 2026-03-24

### Changed
- **README** — improved intro with structured feature list, added documentation link callout, replaced broken Glama badge with card layout, added License and MCP Tools badges, corrected MCP tool count from 31 to 44.
- **Docs page** — added short descriptions to every CLI command in the web reference.
- **Repo settings** — added CODEOWNERS, updated branch rulesets to require `check` + `analyze` status checks and code owner review, disabled default CodeQL setup.

## [0.9.1] — 2026-03-24

### Changed
- **CHANGELOG** — added missing Tier 4–6 feature entries (composite secrets, approvals, JIT, exec, scanner, linter, memory, context, governance, scopes, rotation, CI validation, audit export) to the v0.9.0 record.
- **Web landing site** — added 11 feature cards, 3 MCP tool groups (15 tools), 8 architecture modules; updated tool count from 31 to 44 and feature count from 13 to 24.
- **Web changelog** — synced with CHANGELOG.md.
- **Stats** — removed Tiers and Platforms cards; kept MCP Tools and Quantum Features.

## [0.9.0] — 2026-03-22

### Added
- **Composite / Templated Secrets** — store connection strings with `{{OTHER_KEY}}` placeholders that resolve dynamically on read. MCP tool: `get_secret` (template resolution is automatic).
- **User Approvals (Zero-Trust Agent)** — mark secrets with `--requires-approval` so MCP reads require HMAC-verified, scoped, time-limited approval tokens. CLI: `qring approve`, `qring approvals`. MCP: approval enforcement on `get_secret`.
- **JIT Provisioning** — dynamically generate short-lived tokens on read (AWS STS, Generic HTTP). CLI: `qring set --jit-provider aws-sts`. MCP: automatic JIT resolution on `get_secret`.
- **Secure Execution & Auto-Redaction** — `qring exec` injects secrets into command environments with automatic stdout/stderr redaction of known values. Exec profiles restrict allowed commands.
- **Exec Profiles** — `unrestricted`, `restricted` (blocks curl/wget/ssh, 30s timeout), and `ci` (5min timeout) profiles for `qring exec --profile`. MCP tool: `exec_with_secrets`.
- **Codebase Secret Scanner** — `qring scan` detects hardcoded credentials using regex heuristics and Shannon entropy analysis. MCP tool: `scan_codebase_for_secrets`.
- **Secret-Aware Linter** — `qring lint` scans specific files for hardcoded secrets with optional `--fix` to auto-replace with `process.env.KEY` references. MCP tool: `lint_files`.
- **Agent Memory** — encrypted, persistent key-value store for AI agent sessions. CLI: `qring remember`, `qring recall`, `qring forget`. MCP tools: `agent_remember`, `agent_recall`, `agent_forget`.
- **Project Context** — safe, redacted overview of project secrets, configuration, and state for agent system prompts. CLI: `qring context`. MCP tool: `get_project_context`.
- **Pre-Commit Secret Scanning** — `qring hook:install` adds a git pre-commit hook that blocks commits containing hardcoded secrets.
- **Secret Analytics** — `qring analyze` reports most accessed, unused, stale secrets and gives rotation recommendations. MCP tool: `analyze_secrets`.
- **Service Setup Wizard** — `qring wizard` scaffolds a new service integration with secrets, manifest entries, and hooks in one command.
- **Governance Policy** — `.q-ring.json` `policy` section for MCP tool gating, key access restrictions, exec allowlists, and secret lifecycle rules. CLI: `qring policy`. MCP tools: `check_policy`, `get_policy_summary`.
- **Team & Org Scopes** — `--team` and `--org` flags extend resolution beyond `global` and `project`. Cascade order: project → team → org → global.
- **Issuer-Native Rotation** — `qring rotate` attempts provider-native rotation (OpenAI, Stripe, etc.) or falls back to local generation. MCP tool: `rotate_secret`.
- **CI Secret Validation** — `qring ci:validate` batch-validates all secrets against providers in CI-friendly mode with structured pass/fail output. MCP tool: `ci_validate_secrets`.
- **Tamper-Evident Audit Verify & Export** — `qring audit:verify` checks SHA-256 hash chain integrity; `qring audit:export` outputs jsonl/json/csv. MCP tools: `verify_audit_chain`, `export_audit`.
- **Shared HTTP client** (`http-request`) for validation and hooks with timeouts and response size limits.
- **HTTP hook SSRF mitigation** — resolves hook URLs and blocks private/loopback targets by default; override with `Q_RING_ALLOW_PRIVATE_HOOKS=1` if needed. Denied attempts emit `policy_deny` audit events.
- **Next.js GitHub Pages site** (`web/`) — Tailwind CSS v4, Motion animations, Getting Started (`/docs`) and Changelog (`/changelog`) pages, mobile nav, copyable terminals, animated stats, interactive architecture diagram. Deploy via `deploy-pages.yml` and CI via `nextjs.yml`.

### Changed
- MCP server tool count increased from 31 to 44.
- Architecture expanded with Exec, Scan, Provision, Approval, Context, Linter, Memory, and Policy subsystems.
- **Dashboard** — pathname routing fixes, SSE backpressure, tighter CORS, inline/system fonts and assets for offline use.
- **README** — notes on SSRF protection for HTTP hooks.

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
