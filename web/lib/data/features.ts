import {
  Activity,
  Bell,
  Eye,
  FileCheck,
  FileDown,
  FileText,
  Ghost,
  Hourglass,
  Layers,
  Link2,
  Lock,
  type LucideIcon,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Target,
  TerminalSquare,
  Users,
  Zap,
} from "lucide-react";

export type FeatureCategory = "quantum" | "storage" | "security" | "agent";

export type Feature = {
  id: string;
  category: FeatureCategory;
  Icon: LucideIcon;
  title: string;
  desc: string;
  cmd: string;
  long: string[];
  related?: string[];
};

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  quantum: "Quantum",
  storage: "Storage & Sync",
  security: "Security & Audit",
  agent: "Execution & Agent",
};

export const FEATURES: Feature[] = [
  {
    id: "superposition",
    category: "quantum",
    Icon: Layers,
    title: "Superposition",
    desc:
      "One key holds values for dev, staging, and prod simultaneously. The correct value resolves based on your current context.",
    cmd: 'qring set API_KEY "sk-dev" --env dev',
    long: [
      "A single key like API_KEY can carry distinct values for every environment. Set them once and let q-ring collapse to the right one based on your detected context.",
      "Combine with --tags to group, and --ttl to expire stale environments automatically.",
    ],
    related: ["Wavefunction Collapse", "Env Sync"],
  },
  {
    id: "collapse",
    category: "quantum",
    Icon: Target,
    title: "Wavefunction Collapse",
    desc:
      "Auto-detects your environment from flags, env vars, git branches, and project config. Zero manual switching.",
    cmd: "qring env",
    long: [
      "q-ring inspects NODE_ENV, --env flags, the active git branch, and your .q-ring.json manifest to choose the right environment.",
      "You can override at any time with --env or QRING_ENV.",
    ],
  },
  {
    id: "decay",
    category: "quantum",
    Icon: Hourglass,
    title: "Quantum Decay",
    desc:
      "Secrets with TTL. Expired secrets are blocked, stale ones trigger warnings.",
    cmd: 'qring set TOKEN "tok-..." --ttl 3600',
    long: [
      "Decay turns secret rotation into a calendar event. Expired keys are refused at read time, stale keys raise warnings, and policies can require rotation.",
    ],
    related: ["Issuer-Native Rotation"],
  },
  {
    id: "observer",
    category: "security",
    Icon: Eye,
    title: "Observer Effect",
    desc:
      "Every read, write, and delete is logged. Access patterns are tracked for anomaly detection and audit trails.",
    cmd: "qring audit --anomalies",
    long: [
      "All access is appended to a tamper-evident hash chain. Detect anomalies, export logs (jsonl/json/csv), and verify the chain's integrity at any time.",
    ],
  },
  {
    id: "noise",
    category: "quantum",
    Icon: Activity,
    title: "Quantum Noise",
    desc:
      "Generate cryptographically strong secrets in API key, password, UUID, token, or hex formats.",
    cmd: "qring generate --format api-key",
    long: [
      "Crypto-grade randomness with format presets. Pipe directly into --save to store, or capture to stdout for one-shot use.",
    ],
  },
  {
    id: "entangle",
    category: "quantum",
    Icon: Link2,
    title: "Entanglement",
    desc:
      "Link secrets across projects. When you rotate one, all entangled copies update automatically.",
    cmd: "qring entangle API_KEY API_KEY_BACKUP",
    long: [
      "Useful for keys shared across multiple repositories or worker processes. Rotation propagates atomically; broken entanglements raise warnings.",
    ],
  },
  {
    id: "tunnel",
    category: "quantum",
    Icon: Ghost,
    title: "Tunneling",
    desc:
      "Ephemeral secrets that exist only in memory. Never touch disk. Optional TTL and max-read self-destruction.",
    cmd: 'qring tunnel create "temp-tok" --max-reads 1',
    long: [
      "Tunneled secrets are perfect for short-lived hand-offs (CI artifacts, one-shot deploys). They self-destruct after N reads or when their TTL elapses.",
    ],
  },
  {
    id: "teleport",
    category: "quantum",
    Icon: Send,
    title: "Teleportation",
    desc:
      "Pack secrets into AES-256-GCM encrypted bundles for secure transfer between machines.",
    cmd: 'qring teleport pack --keys "API_KEY"',
    long: [
      "Bundles are AES-256-GCM encrypted with a passphrase you provide. Unpack on the target machine to import the secrets atomically.",
    ],
  },
  {
    id: "validate",
    category: "security",
    Icon: ShieldCheck,
    title: "Liveness Validation",
    desc:
      "Test if a secret is actually valid with its target service. Auto-detects OpenAI, Stripe, GitHub, and AWS from key prefixes.",
    cmd: "qring validate --all",
    long: [
      "Validation providers issue a low-cost API call to confirm a key still works. Run in CI to catch silently rotated secrets.",
    ],
  },
  {
    id: "hooks",
    category: "security",
    Icon: Bell,
    title: "Hooks",
    desc:
      "Register shell commands, HTTP webhooks, or process signals that fire on secret writes, deletes, or rotations.",
    cmd: 'qring hook add --key DB_PASS --exec "..."',
    long: [
      "React to lifecycle events without writing glue. Hooks can shell out, POST to webhooks, or send process signals to running services.",
    ],
  },
  {
    id: "manifest",
    category: "storage",
    Icon: FileCheck,
    title: "Project Manifest",
    desc:
      "Declare required secrets in .q-ring.json and validate project readiness with one command.",
    cmd: "qring check",
    long: [
      "Manifests pin which keys, environments, providers, and tags a project expects. Missing values fail builds before runtime ever sees them.",
    ],
  },
  {
    id: "import",
    category: "storage",
    Icon: FileDown,
    title: "Import",
    desc:
      "Migrate from .env files in one command. Supports standard dotenv syntax with comments, quotes, and escape sequences.",
    cmd: "qring import .env --skip-existing",
    long: [
      "Import is dry-run safe and supports key filtering and environment scoping so you can migrate per-stage without overwriting existing values.",
    ],
  },
  {
    id: "env-sync",
    category: "storage",
    Icon: RefreshCw,
    title: "Env Sync",
    desc:
      "Generate .env files from the project manifest, resolving each key with environment-aware superposition collapse.",
    cmd: "qring env:generate --output .env",
    long: [
      "When a tool absolutely needs a real .env file, env:generate writes one against the active environment with redaction options for committable artifacts.",
    ],
  },
  {
    id: "exec",
    category: "agent",
    Icon: TerminalSquare,
    title: "Secure Execution",
    desc:
      "Run commands with secrets injected into the environment. All known values are auto-redacted from stdout and stderr.",
    cmd: "qring exec -- npm run deploy",
    long: [
      "exec wraps your command, exports just the keys it needs, and pipes both stdout and stderr through a redactor so secrets never leak into logs.",
    ],
  },
  {
    id: "scan",
    category: "security",
    Icon: Search,
    title: "Codebase Scanner",
    desc:
      "Detect hardcoded credentials using regex heuristics and Shannon entropy analysis.",
    cmd: "qring scan .",
    long: [
      "Run before every commit (via the bundled hook) or in CI. --fix replaces the literal with process.env.X and stores the original in q-ring.",
    ],
  },
  {
    id: "policy",
    category: "security",
    Icon: Shield,
    title: "Governance Policy",
    desc:
      "Define MCP tool gating, key access restrictions, exec allowlists, and secret lifecycle rules in .q-ring.json.",
    cmd: "qring policy",
    long: [
      "Policy lives next to the project, is human-readable, and gates every MCP and CLI action. Combine with approvals for zero-trust agent access.",
    ],
  },
  {
    id: "approve",
    category: "security",
    Icon: Lock,
    title: "User Approvals",
    desc:
      "Zero-trust MCP access. Sensitive secrets require HMAC-verified, scoped, time-limited approval tokens before reads.",
    cmd: 'qring approve PROD_DB_URL --for 3600',
    long: [
      "Approvals turn destructive or production-grade reads into a deliberate human action. Tokens are scoped, reasoned, and verifiable.",
    ],
  },
  {
    id: "jit",
    category: "security",
    Icon: Zap,
    title: "JIT Provisioning",
    desc:
      "Dynamically generate short-lived tokens on read. AWS STS role assumption, generic HTTP endpoints, and caching.",
    cmd: 'qring set AWS_KEYS \'...\' --jit-provider aws-sts',
    long: [
      "JIT-backed secrets are minted at read time, cached briefly, and rotated automatically. Perfect for short-lived cloud credentials.",
    ],
  },
  {
    id: "memory",
    category: "agent",
    Icon: FileText,
    title: "Agent Memory",
    desc:
      "Encrypted, persistent key-value store that survives across AI agent sessions. Remember decisions and context.",
    cmd: 'qring remember last_rotation "Rotated on 2026-03-21"',
    long: [
      "Agent memory is a per-project notepad your AI tools can read between runs. Use it for handoff notes, deployment context, or decision logs.",
    ],
  },
  {
    id: "lint",
    category: "security",
    Icon: FileText,
    title: "Secret Linter",
    desc:
      "Scan specific files for hardcoded secrets. Use --fix to auto-replace with process.env references and store in q-ring.",
    cmd: "qring lint src/config.ts --fix",
    long: [
      "lint operates on a curated file list rather than crawling the whole tree, so you can pre-commit specific changes precisely.",
    ],
  },
  {
    id: "scopes",
    category: "storage",
    Icon: Users,
    title: "Team & Org Scopes",
    desc:
      "Share secrets across teams and orgs. Resolution cascades: project → team → org → global (most specific wins).",
    cmd: 'qring set SHARED_KEY "sk-..." --team my-team',
    long: [
      "Scopes are resolved deterministically — projects override team values, teams override org defaults. Audit logs capture which scope served each read.",
    ],
  },
  {
    id: "rotate",
    category: "storage",
    Icon: RefreshCw,
    title: "Issuer-Native Rotation",
    desc:
      "Attempt provider-native secret rotation for supported services, or fall back to local quantum noise generation.",
    cmd: "qring rotate STRIPE_KEY",
    long: [
      "Rotation talks to the issuer first (Stripe, GitHub, AWS, etc.). When the provider lacks a rotation API, q-ring generates locally and updates entanglements.",
    ],
  },
  {
    id: "analyze",
    category: "agent",
    Icon: Activity,
    title: "Secret Analytics",
    desc:
      "Analyze usage patterns: most accessed secrets, unused/stale keys, scope optimization, and rotation recommendations.",
    cmd: "qring analyze",
    long: [
      "analyze is your weekly report card: which secrets are over-fetched, which haven't been touched in months, and which scopes are wider than necessary.",
    ],
  },
];

export const FEATURE_COUNT = FEATURES.length;
