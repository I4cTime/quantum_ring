import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/motion/FadeIn";
import CopyableTerminal from "@/components/CopyableTerminal";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started — q-ring",
  description:
    "Install q-ring, store your first secret, and configure MCP for Cursor, Kiro, or Claude Code.",
};

const installCmds = [
  { pm: "pnpm", cmd: "pnpm add -g @i4ctime/q-ring" },
  { pm: "npm", cmd: "npm install -g @i4ctime/q-ring" },
  { pm: "yarn", cmd: "yarn global add @i4ctime/q-ring" },
  { pm: "bun", cmd: "bun add -g @i4ctime/q-ring" },
  { pm: "brew", cmd: "brew install i4ctime/tap/qring" },
];

const cliReference = [
  {
    command: "set <key> [value]",
    description: "Store a secret (with optional quantum metadata)",
    options: [
      "-g, --global",
      "-p, --project",
      "--team <id>",
      "--org <id>",
      "--project-path <path>",
      "-e, --env <env>",
      "--ttl <seconds>",
      "--expires <iso>",
      "--description <desc>",
      "--tags <tags>",
      "--rotation-format <format>",
      "--rotation-prefix <prefix>",
      "--requires-approval",
      "--jit-provider <provider>",
    ],
    examples: [
      'qring set OPENAI_API_KEY "sk-..." --project --env dev --tags ai,backend',
      "qring set DB_PASSWORD --ttl 3600 --rotation-format password --requires-approval",
    ],
  },
  {
    command: "get <key>",
    description: "Retrieve a secret (collapses superposition if needed)",
    options: [
      "-g, --global",
      "-p, --project",
      "--team <id>",
      "--org <id>",
      "--project-path <path>",
      "-e, --env <env>",
    ],
    examples: ['qring get OPENAI_API_KEY --project --env prod'],
  },
  {
    command: "delete <key> (alias: rm)",
    description: "Remove a secret from the keyring",
    options: ["-g, --global", "-p, --project", "--project-path <path>"],
    examples: ["qring delete LEGACY_TOKEN --project"],
  },
  {
    command: "list (alias: ls)",
    description: "List all secrets with quantum status indicators",
    options: [
      "-g, --global",
      "-p, --project",
      "--team <id>",
      "--org <id>",
      "--project-path <path>",
      "--show-decay",
      "-t, --tag <tag>",
      "--expired",
      "--stale",
      "-f, --filter <pattern>",
    ],
    examples: ['qring list --project --tag payments --filter "STRIPE_*" --show-decay'],
  },
  {
    command: "inspect <key>",
    description: "Show full quantum state of a secret",
    options: ["-g, --global", "-p, --project", "--project-path <path>"],
    examples: ["qring inspect OPENAI_API_KEY --project"],
  },
  {
    command: "export",
    description: "Export secrets as .env or JSON (collapses superposition)",
    options: [
      "-f, --format <format>",
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "-e, --env <env>",
      "-k, --keys <keys>",
      "-t, --tags <tags>",
    ],
    examples: ['qring export --format env --project --env prod --keys OPENAI_API_KEY,STRIPE_KEY'],
  },
  {
    command: "import <file>",
    description: "Import secrets from a .env file",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "-e, --env <env>",
      "--skip-existing",
      "--dry-run",
    ],
    examples: ["qring import .env --project --skip-existing"],
  },
  {
    command: "check",
    description: "Validate project secrets against .q-ring.json manifest",
    options: ["--project-path <path>"],
    examples: ["qring check --project-path ."],
  },
  {
    command: "validate [key]",
    description: "Test if a secret is actually valid with its target service",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "--provider <name>",
      "--all",
      "--manifest",
      "--list-providers",
    ],
    examples: [
      "qring validate OPENAI_API_KEY --project",
      "qring validate --all --manifest --project",
    ],
  },
  {
    command: "exec <command...>",
    description: "Run a command with secrets injected into its environment (output auto-redacted)",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "-e, --env <env>",
      "-k, --keys <keys>",
      "-t, --tags <tags>",
      "--profile <name>",
    ],
    examples: ['qring exec --project --profile restricted --keys OPENAI_API_KEY -- node "scripts/smoke.js"'],
  },
  {
    command: "scan [dir]",
    description: "Scan a codebase for hardcoded secrets",
    options: ["--fix", "-g, --global", "-p, --project", "--project-path <path>"],
    examples: ["qring scan src --fix --project"],
  },
  {
    command: "lint <files...>",
    description: "Lint specific files for hardcoded secrets (with optional auto-fix)",
    options: ["--fix", "-g, --global", "-p, --project", "--project-path <path>"],
    examples: ["qring lint src/config.ts src/client.ts --fix --project"],
  },
  {
    command: "context (alias: describe)",
    description: "Show safe, redacted project context for AI agents (no secret values exposed)",
    options: ["-g, --global", "-p, --project", "--project-path <path>", "--json"],
    examples: ["qring context --project --json"],
  },
  {
    command: "remember <key> <value>",
    description: "Store a key-value pair in encrypted agent memory (persists across sessions)",
    options: [],
    examples: ['qring remember deployment_note "rotate Stripe key after release"'],
  },
  {
    command: "recall [key]",
    description: "Retrieve a value from agent memory, or list all keys",
    options: [],
    examples: ["qring recall deployment_note", "qring recall"],
  },
  {
    command: "forget <key>",
    description: "Delete a key from agent memory",
    options: ["--all"],
    examples: ["qring forget deployment_note"],
  },
  {
    command: "approve <key>",
    description: "Grant a scoped, reasoned, HMAC-verified approval token for MCP secret access",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "--for <seconds>",
      "--reason <text>",
      "--revoke",
      "--list",
    ],
    examples: ['qring approve OPENAI_API_KEY --project --for 1800 --reason "temporary agent read"'],
  },
  {
    command: "approvals",
    description: "List all approval tokens with verification status",
    options: [],
    examples: ["qring approvals"],
  },
  {
    command: "hook:install",
    description: "Install a git pre-commit hook that scans for hardcoded secrets",
    options: ["--project-path <path>"],
    examples: ["qring hook:install --project-path ."],
  },
  {
    command: "hook:uninstall",
    description: "Remove the q-ring pre-commit hook",
    options: ["--project-path <path>"],
    examples: ["qring hook:uninstall --project-path ."],
  },
  {
    command: "hook:run",
    description: "Run the pre-commit secret scan (called by the git hook)",
    options: [],
    examples: ["qring hook:run"],
  },
  {
    command: "wizard <name>",
    description: "Set up a new service integration with secrets, manifest, and hooks",
    options: [
      "--keys <keys>",
      "--provider <provider>",
      "--tags <tags>",
      "--hook-exec <cmd>",
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
    ],
    examples: ['qring wizard stripe --keys STRIPE_KEY,STRIPE_WEBHOOK_SECRET --provider stripe --tags payments,prod'],
  },
  {
    command: "analyze",
    description: "Analyze secret usage patterns and provide optimization suggestions",
    options: ["-g, --global", "-p, --project", "--project-path <path>"],
    examples: ["qring analyze --project"],
  },
  {
    command: "env",
    description: "Show detected environment (wavefunction collapse context)",
    options: ["--project-path <path>"],
    examples: ["qring env --project-path ."],
  },
  {
    command: "generate (alias: gen)",
    description: "Generate a cryptographic secret (quantum noise)",
    options: [
      "-f, --format <format>",
      "-l, --length <n>",
      "--prefix <prefix>",
      "-s, --save <key>",
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
    ],
    examples: ["qring generate --format api-key --prefix sk- --save OPENAI_API_KEY --project"],
  },
  {
    command: "entangle <sourceKey> <targetKey>",
    description: "Link two secrets — rotating one updates the other",
    options: ["-g, --global", "--source-project <path>", "--target-project <path>"],
    examples: ["qring entangle API_KEY API_KEY_BACKUP --source-project . --target-project ../worker"],
  },
  {
    command: "disentangle <sourceKey> <targetKey>",
    description: "Unlink two entangled secrets",
    options: ["-g, --global", "--source-project <path>", "--target-project <path>"],
    examples: ["qring disentangle API_KEY API_KEY_BACKUP --source-project . --target-project ../worker"],
  },
  {
    command: "tunnel create <value>",
    description: "Create a tunneled secret (returns tunnel ID)",
    options: ["--ttl <seconds>", "--max-reads <n>"],
    examples: ['qring tunnel create "temp-token" --ttl 300 --max-reads 1'],
  },
  {
    command: "tunnel read <id>",
    description: "Read a tunneled secret (may self-destruct)",
    options: [],
    examples: ["qring tunnel read tu_abc123"],
  },
  {
    command: "tunnel destroy <id>",
    description: "Destroy a tunneled secret immediately",
    options: [],
    examples: ["qring tunnel destroy tu_abc123"],
  },
  {
    command: "tunnel list (alias: tunnel ls)",
    description: "List active tunnels",
    options: [],
    examples: ["qring tunnel list"],
  },
  {
    command: "teleport pack",
    description: "Pack secrets into an encrypted bundle",
    options: [
      "-k, --keys <keys>",
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
    ],
    examples: ['qring teleport pack --project --keys OPENAI_API_KEY,STRIPE_KEY > bundle.qring'],
  },
  {
    command: "teleport unpack [bundle]",
    description: "Unpack and import secrets from an encrypted bundle",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "--dry-run",
    ],
    examples: ["qring teleport unpack \"$(cat bundle.qring)\" --project --dry-run"],
  },
  {
    command: "audit",
    description: "View the audit log (observer effect)",
    options: ["-k, --key <key>", "-a, --action <action>", "-n, --limit <n>", "--anomalies"],
    examples: ["qring audit --key OPENAI_API_KEY --action read --limit 50"],
  },
  {
    command: "audit:verify",
    description: "Verify the integrity of the audit hash chain",
    options: [],
    examples: ["qring audit:verify"],
  },
  {
    command: "audit:export",
    description: "Export audit events in a portable format",
    options: ["--since <date>", "--until <date>", "--format <fmt>", "-o, --output <file>"],
    examples: ["qring audit:export --since 2026-03-01 --format json -o audit.json"],
  },
  {
    command: "health",
    description: "Check the health of all secrets",
    options: ["-g, --global", "-p, --project", "--project-path <path>"],
    examples: ["qring health --project"],
  },
  {
    command: "hook add",
    description: "Register a new hook",
    options: [
      "--key <key>",
      "--key-pattern <pattern>",
      "--tag <tag>",
      "--scope <scope>",
      "--action <actions>",
      "--exec <command>",
      "--url <url>",
      "--signal-target <target>",
      "--signal-name <signal>",
      "--description <desc>",
    ],
    examples: [
      'qring hook add --key DB_PASSWORD --action write,rotate --exec "pnpm restart:api"',
      "qring hook add --tag payments --url https://hooks.example.com/qring --action rotate",
    ],
  },
  {
    command: "hook list (alias: hook ls)",
    description: "List all registered hooks",
    options: [],
    examples: ["qring hook list"],
  },
  {
    command: "hook remove <id> (alias: hook rm)",
    description: "Remove a hook by ID",
    options: [],
    examples: ["qring hook remove hk_abc123"],
  },
  {
    command: "hook enable <id>",
    description: "Enable a hook",
    options: [],
    examples: ["qring hook enable hk_abc123"],
  },
  {
    command: "hook disable <id>",
    description: "Disable a hook",
    options: [],
    examples: ["qring hook disable hk_abc123"],
  },
  {
    command: "hook test <id>",
    description: "Dry-run a hook with a mock payload",
    options: [],
    examples: ["qring hook test hk_abc123"],
  },
  {
    command: "env:generate",
    description: "Generate a .env file from the project manifest (.q-ring.json)",
    options: ["--project-path <path>", "-o, --output <file>", "-e, --env <env>"],
    examples: ["qring env:generate --project-path . --env prod -o .env"],
  },
  {
    command: "status",
    description: "Launch the quantum status dashboard in your browser",
    options: ["--port <port>", "--no-open"],
    examples: ["qring status --port 9876 --no-open"],
  },
  {
    command: "agent",
    description: "Start the autonomous agent (background monitor)",
    options: [
      "-i, --interval <seconds>",
      "--auto-rotate",
      "-v, --verbose",
      "--project-path <paths>",
      "--once",
    ],
    examples: ["qring agent --once --auto-rotate --project-path .,../worker"],
  },
  {
    command: "rotate <key>",
    description: "Attempt issuer-native rotation of a secret via its provider",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "--provider <name>",
    ],
    examples: ["qring rotate OPENAI_API_KEY --project --provider openai"],
  },
  {
    command: "ci:validate",
    description: "CI-oriented batch validation of all secrets (exit code 1 on failure)",
    options: [
      "-g, --global",
      "-p, --project",
      "--project-path <path>",
      "--json",
    ],
    examples: ["qring ci:validate --project --json"],
  },
  {
    command: "policy",
    description: "Show project governance policy summary",
    options: ["--json"],
    examples: ["qring policy --json"],
  },
] as const;

const mcpToolPrompts = [
  ["get_secret", "Retrieve `OPENAI_API_KEY` from project scope for `prod` and return just the raw value."],
  ["list_secrets", "List project secrets tagged `payments` and show only stale entries matching `STRIPE_*`."],
  ["set_secret", "Set `STRIPE_SECRET_KEY` in project scope with tags `payments,prod` and a TTL of 86400 seconds."],
  ["delete_secret", "Delete `LEGACY_TOKEN` from global scope and confirm whether it existed."],
  ["has_secret", "Check whether `GITHUB_TOKEN` exists in project scope and return true/false."],
  ["export_secrets", "Export only `OPENAI_API_KEY` and `STRIPE_KEY` as `.env` for `prod`."],
  ["import_dotenv", "Import this `.env` content into project scope in dry-run mode and report what would change."],
  ["check_project", "Validate `.q-ring.json` at this path and show missing, stale, and expired required keys."],
  ["env_generate", "Generate `.env` content from the project manifest for `staging` without writing files."],
  ["inspect_secret", "Inspect `DB_PASSWORD` and summarize scope, decay state, tags, and entanglement metadata."],
  ["detect_environment", "Detect current environment for this project path and include the detection source."],
  ["generate_secret", "Generate an `api-key` with prefix `sk-` and save it as `OPENAI_API_KEY` in project scope."],
  ["entangle_secrets", "Entangle `API_KEY` in this project with `API_KEY_BACKUP` in another project path."],
  ["disentangle_secrets", "Remove entanglement between `API_KEY` and `API_KEY_BACKUP` and confirm success."],
  ["tunnel_create", "Create an ephemeral tunnel value with TTL 300 and maxReads 1, then return the tunnel ID."],
  ["tunnel_read", "Read tunnel `tu_abc123` once and return value or not-found/expired status."],
  ["tunnel_list", "List all active tunnels with read counts and time remaining."],
  ["tunnel_destroy", "Destroy tunnel `tu_abc123` immediately and confirm whether it existed."],
  ["teleport_pack", "Pack keys `OPENAI_API_KEY` and `STRIPE_KEY` into an encrypted bundle using this passphrase."],
  ["teleport_unpack", "Unpack this teleport bundle in dry-run mode and list keys and scopes that would be imported."],
  ["audit_log", "Return last 100 `read` audit events for `OPENAI_API_KEY` in reverse chronological order."],
  ["detect_anomalies", "Detect anomalies for `OPENAI_API_KEY` and include recommendations."],
  ["health_check", "Run a project-scope health check and summarize healthy/stale/expired plus anomaly count."],
  ["validate_secret", "Validate `OPENAI_API_KEY` with provider auto-detection and return provider + latency."],
  ["list_providers", "List available validation providers with descriptions and known key prefixes."],
  ["register_hook", "Register an HTTP hook for `DB_PASSWORD` rotate events to this URL with a clear description."],
  ["list_hooks", "List all registered hooks and include type, match criteria, and enabled status."],
  ["remove_hook", "Remove hook `hk_abc123` and return a not-found error if it does not exist."],
  ["exec_with_secrets", "Run `node scripts/smoke.js` with only `OPENAI_API_KEY` injected using restricted profile."],
  ["scan_codebase_for_secrets", "Scan `./src` for hardcoded secrets and return file, line, key name, and entropy."],
  ["get_project_context", "Return redacted project context for this path including manifest and recent actions."],
  ["agent_remember", "Remember the note `rotated Stripe keys after release` under key `release_notes`."],
  ["agent_recall", "Recall key `release_notes`; if omitted, list all memory keys and update times."],
  ["agent_forget", "Forget memory key `release_notes` and report whether it was present."],
  ["lint_files", "Lint these files for hardcoded secrets in fix mode and return structured fix results."],
  ["analyze_secrets", "Analyze project secrets for unused keys, stale entries, and top read frequency."],
  ["status_dashboard", "Start dashboard on port 9876 and return the local URL to open in a browser."],
  ["agent_scan", "Run one agent scan with auto-rotate enabled across these project paths and return report JSON."],
  ["verify_audit_chain", "Verify audit hash-chain integrity and show first break location if tampering is detected."],
  ["export_audit", "Export audit events as JSON from 2026-03-01 until now."],
  ["rotate_secret", "Attempt provider-native rotation for `OPENAI_API_KEY` and store the new value if rotated."],
  ["ci_validate_secrets", "Run CI batch validation for project scope and return pass/fail summary JSON."],
  ["check_policy", "Check whether command `npm publish` is allowed by exec policy for this project path."],
  ["get_policy_summary", "Return governance policy summary for this project, including tool and secret lifecycle rules."],
] as const;

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-24 pb-16 relative z-1">
        <div className="max-w-[800px] mx-auto px-6">
          <FadeIn>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-accent mb-8 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to home
            </Link>
          </FadeIn>

          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
              Getting Started
            </h1>
            <p className="text-text-secondary text-lg mb-12 leading-relaxed">
              Three steps to quantum-secured secrets: install, store, and
              integrate.
            </p>
          </FadeIn>

          {/* Step 1: Install */}
          <FadeIn delay={0.1}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </span>
                Install q-ring
              </h2>
              <p className="text-text-secondary mb-6">
                Pick your package manager and install globally:
              </p>
              <div className="space-y-3">
                {installCmds.map((i) => (
                  <CopyableTerminal key={i.pm} title={i.pm} maxWidth="100%">
                    <pre>
                      <span className="text-green font-bold">$</span>{" "}
                      <span className="text-accent-bright font-medium">{i.cmd}</span>
                    </pre>
                  </CopyableTerminal>
                ))}
              </div>
            </section>
          </FadeIn>

          {/* Step 2: First secret */}
          <FadeIn delay={0.2}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </span>
                Store your first secret
              </h2>
              <p className="text-text-secondary mb-6">
                Secrets are stored in your OS-native keyring (macOS Keychain,
                Windows Credential Vault, or Linux Secret Service):
              </p>
              <CopyableTerminal title="~ / terminal" maxWidth="100%">
                <pre>
                  <span className="text-[#555]"># Store a secret</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring set</span> OPENAI_API_KEY sk-proj-abc123...
                  {"\n\n"}
                  <span className="text-[#555]"># Retrieve it</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring get</span> OPENAI_API_KEY
                  {"\n"}
                  sk-proj-abc123...
                  {"\n\n"}
                  <span className="text-[#555]"># List all stored keys</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring list</span>
                  {"\n"}
                  OPENAI_API_KEY  [dev]  healthy  0 reads
                  {"\n\n"}
                  <span className="text-[#555]"># Run a health check</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring health</span>
                </pre>
              </CopyableTerminal>
            </section>
          </FadeIn>

          {/* Step 3: MCP config */}
          <FadeIn delay={0.3}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </span>
                Configure MCP
              </h2>
              <p className="text-text-secondary mb-6">
                Add q-ring as an MCP server so AI agents can manage secrets
                natively. Just add one entry to your config:
              </p>

              <h3 className="text-lg font-semibold mb-3 text-text-primary">
                Cursor / Kiro
              </h3>
              <div className="mb-6">
                <CopyableTerminal title=".cursor/mcp.json" maxWidth="100%">
                  <pre>
                    {`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                  </pre>
                </CopyableTerminal>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-text-primary">
                Claude Code
              </h3>
              <CopyableTerminal title="claude_desktop_config.json" maxWidth="100%">
                <pre>
                  {`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                </pre>
              </CopyableTerminal>
            </section>
          </FadeIn>

          {/* Step 4: Cursor Plugin */}
          <FadeIn delay={0.35}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  4
                </span>
                Cursor Plugin
              </h2>
              <p className="text-text-secondary mb-6">
                The <strong className="text-text-primary">q-ring Cursor Plugin</strong> brings
                quantum secret management directly into your IDE. Install from the
                Cursor marketplace or copy manually:
              </p>

              <div className="rounded-md border border-border bg-bg-card p-5 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-accent-bright font-semibold mb-1">3 Rules</p>
                    <p className="text-text-secondary">Always-on guidance for secret hygiene, q-ring workflow, and .env safety</p>
                  </div>
                  <div>
                    <p className="text-accent-bright font-semibold mb-1">4 Skills</p>
                    <p className="text-text-secondary">Auto-triggered: secret management, scanning, rotation, onboarding</p>
                  </div>
                  <div>
                    <p className="text-accent-bright font-semibold mb-1">2 Agents</p>
                    <p className="text-text-secondary">Security auditor and day-to-day secret ops assistant</p>
                  </div>
                  <div>
                    <p className="text-accent-bright font-semibold mb-1">5 Commands</p>
                    <p className="text-text-secondary">Scan, health-check, rotate, setup, and teleport</p>
                  </div>
                  <div>
                    <p className="text-accent-bright font-semibold mb-1">2 Hooks</p>
                    <p className="text-text-secondary">After file edit and session start automation</p>
                  </div>
                  <div>
                    <p className="text-accent-bright font-semibold mb-1">MCP Connector</p>
                    <p className="text-text-secondary">Auto-connects to qring-mcp — all 44 tools available</p>
                  </div>
                </div>
              </div>

              <CopyableTerminal title="manual install" maxWidth="100%">
                <pre>
                  <span className="text-[#555]"># From the quantum_ring repo</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">cp -r cursor-plugin/ ~/.cursor/plugins/qring/</span>
                </pre>
              </CopyableTerminal>
            </section>
          </FadeIn>

          <section className="mb-16 border-t border-border pt-10">
              <h2 className="text-3xl font-bold mb-4 text-text-primary">
                CLI Complete Reference
              </h2>
              <p className="text-text-secondary mb-6">
                Every CLI command and option is listed below with at least one real invocation example.
              </p>
              <div className="space-y-5">
                {cliReference.map((item) => (
                  <div
                    key={item.command}
                    className="rounded-md border border-border bg-bg-card p-5"
                  >
                    <h3 className="text-lg font-semibold text-text-primary mb-1 font-[family-name:var(--font-mono)]">
                      qring {item.command}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-text-secondary mb-4">
                        {item.description}
                      </p>
                    )}
                    <div className="mb-3">
                      <p className="text-sm text-text-dim mb-2">Options</p>
                      {item.options.length === 0 ? (
                        <p className="text-sm text-text-secondary">No command-specific options.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.options.map((opt) => (
                            <span
                              key={opt}
                              className="rounded border border-border px-2 py-1 text-xs font-[family-name:var(--font-mono)] text-accent-bright bg-accent-dim"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <CopyableTerminal title={`qring ${item.command}`} maxWidth="100%">
                      <pre>
                        {item.examples.map((ex, idx) => (
                          <span key={ex}>
                            <span className="text-green font-bold">$</span>{" "}
                            <span className="text-accent-bright font-medium">{ex}</span>
                            {idx < item.examples.length - 1 ? "\n" : ""}
                          </span>
                        ))}
                      </pre>
                    </CopyableTerminal>
                  </div>
                ))}
              </div>
            </section>

          <section className="mb-16 border-t border-border pt-10">
              <h2 className="text-3xl font-bold mb-4 text-text-primary">
                MCP Prompt Cookbook
              </h2>
              <p className="text-text-secondary mb-6">
                Every MCP tool in q-ring with a one-sentence prompt example you can paste into an agent chat.
              </p>
              <div className="space-y-3">
                {mcpToolPrompts.map(([tool, prompt]) => (
                  <div
                    key={tool}
                    className="rounded-md border border-border bg-bg-card p-4"
                  >
                    <p className="text-sm mb-2">
                      <span className="font-[family-name:var(--font-mono)] text-accent-bright">
                        {tool}
                      </span>
                    </p>
                    <p className="text-sm text-text-secondary">{prompt}</p>
                  </div>
                ))}
              </div>
            </section>

          <FadeIn delay={0.45}>
            <div className="border-t border-border pt-8 text-center">
              <p className="text-text-secondary mb-4">
                Ready to explore more features?
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/#features"
                  className="px-6 py-2.5 bg-accent/10 text-accent border border-accent/30 rounded-md text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                  Explore Features
                </Link>
                <Link
                  href="/changelog"
                  className="px-6 py-2.5 bg-bg-card text-text-secondary border border-border rounded-md text-sm font-medium hover:border-border-glow transition-colors"
                >
                  View Changelog
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
