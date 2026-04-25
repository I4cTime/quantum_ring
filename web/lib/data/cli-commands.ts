import {
  Bell,
  Box,
  Eye,
  Ghost,
  Layers,
  type LucideIcon,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

export type CliCommand = {
  command: string;
  example: string;
  desc: string;
};

export type CliGroup = {
  id: string;
  title: string;
  Icon: LucideIcon;
  commands: CliCommand[];
};

export const CLI_GROUPS: CliGroup[] = [
  {
    id: "secret",
    title: "Secret",
    Icon: Box,
    commands: [
      {
        command: "qring set",
        example: "qring set OPENAI_API_KEY sk-... --project --env dev",
        desc: "Store a secret with optional decay, env, and tags",
      },
      {
        command: "qring get",
        example: "qring get OPENAI_API_KEY --project --env prod",
        desc: "Retrieve a secret (collapses superposition)",
      },
      {
        command: "qring list",
        example: "qring list --project --show-decay",
        desc: "List secrets with quantum status indicators",
      },
      {
        command: "qring inspect",
        example: "qring inspect OPENAI_API_KEY --project",
        desc: "Show full quantum state for a secret",
      },
    ],
  },
  {
    id: "exec",
    title: "Exec & Env",
    Icon: Layers,
    commands: [
      {
        command: "qring exec",
        example: "qring exec --project -- node app.js",
        desc: "Run a command with secrets injected and output redacted",
      },
      {
        command: "qring export",
        example: "qring export --format env --project --env prod",
        desc: "Export to .env or JSON (collapses superposition)",
      },
      {
        command: "qring import",
        example: "qring import .env --project --skip-existing",
        desc: "Import secrets from a .env file",
      },
    ],
  },
  {
    id: "validate",
    title: "Validate & Audit",
    Icon: ShieldCheck,
    commands: [
      {
        command: "qring validate",
        example: "qring validate --all --manifest --project",
        desc: "Test secrets against their target services",
      },
      {
        command: "qring scan",
        example: "qring scan src --fix --project",
        desc: "Scan a codebase for hardcoded secrets",
      },
      {
        command: "qring audit",
        example: "qring audit --tail 50",
        desc: "Show recent audit events from the tamper-evident log",
      },
    ],
  },
  {
    id: "tunnel",
    title: "Tunnel",
    Icon: Ghost,
    commands: [
      {
        command: "qring tunnel create",
        example: "qring tunnel create temp-token --ttl 300 --max-reads 1",
        desc: "Create an ephemeral in-memory secret",
      },
      {
        command: "qring tunnel read",
        example: "qring tunnel read tu_abc123",
        desc: "Read a tunneled secret (may self-destruct)",
      },
    ],
  },
  {
    id: "teleport",
    title: "Teleport",
    Icon: Send,
    commands: [
      {
        command: "qring teleport pack",
        example: "qring teleport pack --project --keys OPENAI_API_KEY > b.qring",
        desc: "Pack secrets into an encrypted bundle",
      },
      {
        command: "qring teleport unpack",
        example: "qring teleport unpack bundle.qring",
        desc: "Unpack and import secrets from a bundle",
      },
    ],
  },
  {
    id: "quantum",
    title: "Quantum",
    Icon: Sparkles,
    commands: [
      {
        command: "qring entangle",
        example: "qring entangle API_KEY API_KEY_BACKUP",
        desc: "Link secrets — rotating one updates the other",
      },
      {
        command: "qring generate",
        example: "qring generate --format api-key --prefix sk- --save NEW_KEY",
        desc: "Generate cryptographic secrets via quantum noise",
      },
    ],
  },
  {
    id: "agent",
    title: "Agent Memory",
    Icon: Eye,
    commands: [
      {
        command: "qring remember",
        example: 'qring remember note "rotate Stripe key after release"',
        desc: "Store key-value in encrypted agent memory",
      },
      {
        command: "qring recall",
        example: "qring recall note",
        desc: "Recall a value from agent memory",
      },
      {
        command: "qring context",
        example: "qring context --project --json",
        desc: "Safe, redacted project context for AI agents",
      },
    ],
  },
  {
    id: "hooks",
    title: "Hooks",
    Icon: Bell,
    commands: [
      {
        command: "qring hook:install",
        example: "qring hook:install --project-path .",
        desc: "Install a git pre-commit hook for secret scanning",
      },
      {
        command: "qring hook:run",
        example: "qring hook:run",
        desc: "Run the pre-commit secret scan manually",
      },
    ],
  },
  {
    id: "wizard",
    title: "Wizard",
    Icon: Wand2,
    commands: [
      {
        command: "qring wizard",
        example: "qring wizard stripe --keys STRIPE_KEY,STRIPE_WEBHOOK_SECRET",
        desc: "Set up a service integration with secrets, manifest, and hooks",
      },
      {
        command: "qring init",
        example: "qring init",
        desc: "Initialize q-ring in the current project",
      },
    ],
  },
];

export const CLI_COMMAND_COUNT = CLI_GROUPS.reduce(
  (acc, g) => acc + g.commands.length,
  0,
);
