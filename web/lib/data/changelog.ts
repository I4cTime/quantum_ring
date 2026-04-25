export type ChangeType = "added" | "changed" | "fixed" | "security";

export type ChangelogHighlight = {
  type: ChangeType;
  text: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  highlights: ChangelogHighlight[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "Unreleased",
    date: "",
    highlights: [
      { type: "changed", text: "Status dashboard rebuilt — `qring status` now serves a denser page with a KPI strip (secrets, env, protected, approvals, hooks, 24h reads/writes, denied actions, anomalies), a sortable + searchable secrets table, and dedicated panels for manifest gaps, governance policy, active approvals (with tamper / expiry state), registered hooks, and agent memory" },
      { type: "changed", text: "Audit feed gained action chips (read/write/delete/export), source chips (cli/mcp/hook/agent), and a free-text filter; top bar adds pause / refresh / JSON controls plus a relative `updated Ns ago` timestamp that keeps ticking while paused" },
      { type: "changed", text: "Snapshot payload (`/api/status` + SSE) now also includes version, projectPath, scopes, protectedCount, manifest, policy, approvals, hooks, memoryKeys, and auditMetrics (action / source counts, top read keys, total events in the last 24h)" },
      { type: "added", text: "Keyboard shortcuts on the dashboard — `/` focuses the secrets search, `P` pauses SSE, `R` forces refresh, `Esc` blurs the focused input" },
      { type: "fixed", text: "Dashboard search no longer loses focus on the 5-second SSE tick — DOM swaps now preserve caret position, selection, and scroll offset" },
    ],
  },
  {
    version: "0.10.1",
    date: "2026-04-24",
    highlights: [
      { type: "fixed", text: "Publish workflow — removed the broken `npm install -g npm@latest` bootstrap step that had silently blocked v0.9.9 and v0.10.0 from reaching npm (Cannot find module 'promise-retry' on Node 22 runner)" },
      { type: "added", text: "publish.yml gained a workflow_dispatch trigger with optional `ref` input so a stuck release can be re-published manually from the Actions tab" },
      { type: "changed", text: "Functional code unchanged from 0.10.0 — patch exists solely to ship a new artifact through the now-fixed pipeline" },
    ],
  },
  {
    version: "0.10.0",
    date: "2026-04-24",
    highlights: [
      { type: "added", text: "CLI decomposed by category — nine themed modules under src/cli/commands/ (secrets, project, quantum, validation, tooling, audit, hooks, agent, security) replacing the monolithic register-cli-part{1,2,3}" },
      { type: "added", text: "MCP tools decomposed by category — ten focused modules under src/mcp/tools/ plus a shared _shared.ts, replacing the 1.5k-line tool-registration.ts" },
      { type: "added", text: "Grouped CLI help — `qring --help` now renders commands under nine glyph-prefixed sections with dimmed fallback for ungrouped commands" },
      { type: "added", text: "docs/cli-mcp-parity.md — full CLI ↔ MCP mapping, shared behavior notes, and remaining CLI-only / MCP-only gaps" },
      { type: "added", text: "New tests — keyring-lifecycle, ssrf-jit, and an approval-tamper test for workspace/sessionId HMAC coverage (164 tests across 24 files)" },
      { type: "security", text: "Approval HMAC widened to cover `workspace` and `sessionId`; forged or tampered bindings are now rejected and marked `tampered`" },
      { type: "security", text: "Approval HMAC verification uses `crypto.timingSafeEqual` on fixed-length hex digests to reduce timing leakage" },
      { type: "security", text: "~/.config/q-ring/ is created with explicit mode 0o700 for the HMAC secret and approvals registry" },
      { type: "security", text: "JIT HTTP SSRF fails closed on DNS errors and blocks non-http(s) URLs; private-IP resolution check hardened" },
      { type: "security", text: "Teleport AES-GCM now uses the recommended 12-byte IV for new bundles (unpacking unchanged)" },
      { type: "security", text: "entanglement.json and hooks.json writes use mode 0o600; shell hooks switched from exec() to execFile() with bounded stdout buffer" },
      { type: "changed", text: "Renamed httpRequest_ → httpRequest across utils and call sites; node:http request imported as httpRequestPlain to clear the shadowing" },
      { type: "changed", text: "`qring get` default output is JSON; `--raw` restores legacy stdout-only value. MCP get_secret / list_secrets / tunnel_* / agent_recall now return structured JSON text" },
      { type: "fixed", text: "policy.secrets enforced on setSecret; JIT envelope refresh uses a cross-process file lock under ~/.config/q-ring/jit-locks/; queryAudit capped to last 12MB" },
      { type: "fixed", text: "Removed dead src/services/types.ts and the `void listSecrets;` tree-shake workaround; cleaned up unused parameters to keep --noUnusedParameters green" },
    ],
  },
  {
    version: "0.9.9",
    date: "2026-03-25",
    highlights: [
      { type: "security", text: "hono >=4.12.12 — resolves 5 medium vulnerabilities in transitive dep via @modelcontextprotocol/sdk" },
      { type: "security", text: "@hono/node-server >=1.19.13 — resolves serveStatic bypass via @modelcontextprotocol/sdk" },
      { type: "security", text: "vite >=8.0.5 — resolves 2 high + 1 medium vulnerability in dev dep via vitest" },
    ],
  },
  {
    version: "0.9.8",
    date: "2026-03-25",
    highlights: [
      { type: "security", text: "SSRF protection expanded — shared guard applied to validate.ts and provision.ts; blocks private/loopback addresses" },
      { type: "security", text: "Shell injection fix — pgrep in hooks.ts now uses spawn() instead of exec() to prevent metacharacter injection" },
      { type: "security", text: "Dashboard XSS fix — audit action field escaped in renderAudit to prevent script injection" },
      { type: "security", text: "MCP policy enforcement — listSecrets, exportSecrets, hasSecret, deleteSecret, getEnvelope now enforce key read policy" },
      { type: "security", text: "Crypto hardening — tunnel IDs use crypto.randomBytes; memory encryption key stored in OS keyring with migration" },
      { type: "security", text: "Glob-to-regex escaping — metacharacters escaped in MCP list filter and hook keyPattern matching" },
      { type: "security", text: "Exec profile hardening — denyCommands uses word-boundary regex instead of substring matching" },
      { type: "security", text: "Dependency overrides — path-to-regexp >=8.4.0 resolves known vulnerability" },
      { type: "added", text: "src/core/ssrf.ts — shared SSRF guard with isPrivateIP, checkSSRF (async), and checkSSRFSync" },
      { type: "added", text: "CSP meta tag added to web layout for defense-in-depth on GitHub Pages" },
      { type: "added", text: "12 SSRF tests + tunnel ID uniqueness test (150 total tests)" },
    ],
  },
  {
    version: "0.9.7",
    date: "2026-03-26",
    highlights: [
      { type: "fixed", text: "Nav anchor links on subpages — clicking section links from /docs or /changelog now routes back to the homepage via Next.js Link instead of broken same-page anchors" },
    ],
  },
  {
    version: "0.9.6",
    date: "2026-03-26",
    highlights: [
      { type: "security", text: "Double-escaping fix — `parseDotenv()` escape chain replaced with single-pass regex to prevent double-unescape (CodeQL js/double-escaping, high severity)" },
      { type: "security", text: "picomatch >=4.0.4 override added to web lockfile — resolves ReDoS and method injection vulnerabilities" },
      { type: "security", text: "Stale `package-lock.json` removed — eliminated false-positive Dependabot alerts; added to .gitignore" },
      { type: "added", text: "8 new `parseDotenv` unit tests covering escape sequences, double-backslash handling, and edge cases (133 total)" },
    ],
  },
  {
    version: "0.9.5",
    date: "2026-03-26",
    highlights: [
      { type: "added", text: "Cursor marketplace plugin — 3 rules, 4 skills, 2 agents, 5 commands, 2 hooks, MCP connector. All 44 tools surfaced through IDE-native components" },
      { type: "added", text: "Marketplace discovery — `.cursor-plugin/marketplace.json` for monorepo-based plugin resolution" },
      { type: "added", text: "Web: Cursor Plugin homepage section, plugin nav link, Homebrew install tabs in Hero and docs" },
      { type: "added", text: "README: Cursor Plugin section and Homebrew install option" },
      { type: "fixed", text: "Removed beforeShellExecution hook — caused circular block with Cursor metadata injection" },
      { type: "security", text: "picomatch >=4.0.4 override — resolves ReDoS and method injection vulnerabilities in tsup > tinyglobby > picomatch" },
    ],
  },
  {
    version: "0.9.4",
    date: "2026-03-25",
    highlights: [
      { type: "added", text: "Vitest test suite — 125 tests across 17 files covering core, CLI, and MCP (all 44 tools verified)" },
      { type: "added", text: "CI test step — `pnpm run test:ci` added to ci.yml workflow" },
      { type: "added", text: "Homebrew tap — `brew install i4ctime/tap/qring` with auto-update workflow on release" },
    ],
  },
  {
    version: "0.9.3",
    date: "2026-03-25",
    highlights: [
      { type: "changed", text: "Custom domain — site now served at `qring.i4c.studio`" },
      { type: "changed", text: "Funding — Ko-fi slug updated; favicon metadata added" },
      { type: "changed", text: "Deploy workflow — CNAME file persists across gh-pages deploys" },
    ],
  },
  {
    version: "0.9.2",
    date: "2026-03-24",
    highlights: [
      { type: "changed", text: "README — improved intro, fixed badges, corrected MCP tool count from 31 to 44" },
      { type: "changed", text: "Docs page — added descriptions to every CLI command" },
      { type: "changed", text: "Repo settings — CODEOWNERS, branch rulesets, disabled default CodeQL" },
    ],
  },
  {
    version: "0.9.1",
    date: "2026-03-24",
    highlights: [
      { type: "changed", text: "CHANGELOG — added missing Tier 4–6 feature entries to the v0.9.0 record" },
      { type: "changed", text: "Web landing site — added 11 feature cards, 3 MCP tool groups (15 tools), 8 architecture modules; updated counts" },
      { type: "changed", text: "Web changelog — synced with CHANGELOG.md" },
      { type: "changed", text: "Stats — removed Tiers and Platforms cards; kept MCP Tools and Quantum Features" },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-03-22",
    highlights: [
      { type: "added", text: "Composite / Templated Secrets — `{{OTHER_KEY}}` placeholders in connection strings resolve dynamically on read" },
      { type: "added", text: "User Approvals (Zero-Trust Agent) — HMAC-verified, scoped, time-limited approval tokens for sensitive MCP reads" },
      { type: "added", text: "JIT Provisioning — dynamically generate short-lived tokens on read (AWS STS, Generic HTTP)" },
      { type: "added", text: "Secure Execution & Auto-Redaction — `qring exec` injects secrets with automatic stdout/stderr redaction" },
      { type: "added", text: "Exec Profiles — `unrestricted`, `restricted`, and `ci` profiles for command execution policy" },
      { type: "added", text: "Codebase Secret Scanner — `qring scan` detects hardcoded credentials via regex + Shannon entropy" },
      { type: "added", text: "Secret-Aware Linter — `qring lint --fix` auto-replaces hardcoded values with `process.env.KEY` references" },
      { type: "added", text: "Agent Memory — encrypted persistent key-value store across AI agent sessions" },
      { type: "added", text: "Project Context — safe, redacted project overview for agent system prompts" },
      { type: "added", text: "Pre-Commit Secret Scanning — `qring hook:install` blocks commits containing hardcoded secrets" },
      { type: "added", text: "Secret Analytics — `qring analyze` reports usage patterns and rotation recommendations" },
      { type: "added", text: "Service Setup Wizard — `qring wizard` scaffolds service integrations in one command" },
      { type: "added", text: "Governance Policy — `.q-ring.json` policy engine for MCP tool gating, key access, and exec restrictions" },
      { type: "added", text: "Team & Org Scopes — `--team` and `--org` flags with cascade resolution (project → team → org → global)" },
      { type: "added", text: "Issuer-Native Rotation — `qring rotate` attempts provider-native rotation before falling back to local generation" },
      { type: "added", text: "CI Secret Validation — `qring ci:validate` batch-validates all secrets with structured pass/fail output" },
      { type: "added", text: "Tamper-Evident Audit — `qring audit:verify` checks SHA-256 chain integrity; `qring audit:export` outputs jsonl/json/csv" },
      { type: "added", text: "Shared HTTP client for validation/hooks; SSRF mitigation for HTTP hooks (private IP block; Q_RING_ALLOW_PRIVATE_HOOKS override)" },
      { type: "added", text: "Next.js site refresh — Tailwind v4, Motion, /docs, /changelog, mobile nav, copyable terminals, stats, interactive architecture" },
      { type: "changed", text: "MCP server tool count increased from 31 to 44" },
      { type: "changed", text: "Dashboard routing, SSE backpressure, CORS, offline-safe HTML" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-03-22",
    highlights: [
      { type: "added", text: "Secret Liveness Validation — `qring validate` tests secrets against live services (OpenAI, Stripe, GitHub, AWS, Generic HTTP)" },
      { type: "added", text: "Hooks on Secret Change — shell commands, HTTP webhooks, or process signals on write/delete/rotate" },
      { type: "added", text: "`.env` file import — `qring import .env` parses dotenv syntax and bulk-stores secrets" },
      { type: "added", text: "Project Secret Manifest — `.q-ring.json` for declaring required secrets" },
      { type: "added", text: "Env File Sync — `qring env:generate` produces .env from manifest" },
      { type: "added", text: "Disentangle command, Selective export, branchMap globs, Configurable rotation, Secret search/filtering" },
      { type: "changed", text: "MCP tool count increased from 20 to 31" },
    ],
  },
  {
    version: "0.3.2",
    date: "2026-03-21",
    highlights: [
      { type: "security", text: "Resolved 8 CodeQL `js/clear-text-logging` alerts by sanitizing keyring metadata" },
    ],
  },
  {
    version: "0.3.1",
    date: "2026-03-21",
    highlights: [
      { type: "fixed", text: "Dashboard re-rendering — cards now update in-place via differential DOM patching" },
      { type: "fixed", text: "Audit log noise — `qring list` from dashboard no longer generates audit entries" },
      { type: "changed", text: "Increased dashboard font sizes for readability" },
      { type: "changed", text: "Replaced dashboard header icon with project icon" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-03-21",
    highlights: [
      { type: "added", text: "Quantum Status Dashboard — live SSE dashboard with 8 panels at `qring status`" },
      { type: "added", text: "MCP `status_dashboard` tool for AI agents" },
      { type: "added", text: "MCP Registry support, GitHub issue templates, SECURITY.md" },
      { type: "fixed", text: "Shebang and bin paths corrected" },
    ],
  },
  {
    version: "0.2.7",
    date: "2026-03-20",
    highlights: [
      { type: "added", text: "Initial public release with quantum keyring core, MCP server (20 tools), and CLI" },
      { type: "added", text: "Superposition, entanglement, tunneling, teleportation, decay, observer, and agent features" },
      { type: "added", text: "GitHub Pages landing site, Glama integration" },
    ],
  },
];

export const CHANGELOG_RELEASE_COUNT = CHANGELOG.length;
