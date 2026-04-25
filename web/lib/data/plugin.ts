import {
  Bell,
  FileText,
  Link2,
  type LucideIcon,
  TerminalSquare,
  Users,
  Zap,
} from "lucide-react";

export type PluginAsset = {
  name: string;
  desc: string;
};

export type PluginCategory = {
  id: string;
  Icon: LucideIcon;
  title: string;
  count: number;
  summary: string;
  description: string[];
  assets: PluginAsset[];
};

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  {
    id: "rules",
    Icon: FileText,
    title: "Rules",
    count: 3,
    summary:
      "Always-on guidance: secret hygiene, q-ring workflow, and .env file safety.",
    description: [
      "Rules are persistent system-prompt fragments that Cursor injects into every chat. They keep the model honest about secret handling and align it with the q-ring workflow.",
    ],
    assets: [
      {
        name: "secret-hygiene.mdc",
        desc: "Bans hardcoded secrets, recommends q-ring lookups, and reminds the agent to redact before logging.",
      },
      {
        name: "qring-workflow.mdc",
        desc: "Codifies the canonical workflow: detect → set → exec → validate → audit.",
      },
      {
        name: "env-file-safety.mdc",
        desc: "Forbids creating .env files in committed paths, recommends env:generate or exec instead.",
      },
    ],
  },
  {
    id: "skills",
    Icon: Zap,
    title: "Skills",
    count: 5,
    summary:
      "Auto-triggered by context: management, scanning, rotation, exec-with-secrets, and project onboarding.",
    description: [
      "Skills are richer playbooks the agent loads when a task matches. Each skill is a folder of prompt fragments and example sessions you can extend.",
    ],
    assets: [
      { name: "secret-management", desc: "End-to-end create/read/rotate/share/forget flows." },
      { name: "secret-scanning", desc: "Detects hardcoded credentials in diffs and full repos." },
      { name: "secret-rotation", desc: "Plans rotations with provider validation and entanglement updates." },
      { name: "exec-with-secrets", desc: "Wraps shell commands so secrets never escape the process boundary." },
      { name: "project-onboarding", desc: "Bootstraps .q-ring.json, imports .env, and pins required keys." },
    ],
  },
  {
    id: "agents",
    Icon: Users,
    title: "Agents",
    count: 2,
    summary:
      "Security auditor for proactive monitoring and secret-ops for daily management.",
    description: [
      "Agents are scoped sub-personas with their own system prompts and tool grants. Use them to delegate sensitive operations cleanly.",
    ],
    assets: [
      {
        name: "security-auditor",
        desc: "Read-only persona that monitors anomalies, audit chain integrity, and policy drift.",
      },
      {
        name: "secret-ops",
        desc: "Scoped writer for day-to-day rotations, validations, and team scope changes.",
      },
    ],
  },
  {
    id: "commands",
    Icon: TerminalSquare,
    title: "Commands",
    count: 8,
    summary:
      "Slash commands for the most common operator tasks: scan, rotate, validate, exec, teleport, and more.",
    description: [
      "Commands are addressable from the slash menu (/qring scan, /qring rotate-expired, etc.) and run a structured workflow with the right tools and prompts already wired up.",
    ],
    assets: [
      { name: "/qring scan-secrets", desc: "Scan a directory for hardcoded credentials." },
      { name: "/qring health-check", desc: "Full project + secret + provider health report." },
      { name: "/qring rotate-expired", desc: "Find decayed secrets and rotate them via providers." },
      { name: "/qring setup-project", desc: "Create or refresh the project manifest from current usage." },
      { name: "/qring teleport-secrets", desc: "Pack secrets into an encrypted bundle for transfer." },
      { name: "/qring analyze", desc: "Usage analytics and rotation recommendations." },
      { name: "/qring dashboard", desc: "Open the live SSE dashboard — KPIs, secrets table, policy, approvals, hooks, anomalies, audit feed." },
      { name: "/qring exec-safe", desc: "Run a command with secrets injected and stdout redacted." },
    ],
  },
  {
    id: "hooks",
    Icon: Bell,
    title: "Hooks",
    count: 2,
    summary:
      "After-file-edit scan and session-start project context loading.",
    description: [
      "Hooks fire on Cursor lifecycle events. They keep context fresh and catch new secrets the moment they're written.",
    ],
    assets: [
      {
        name: "afterFileEdit",
        desc: "Runs the secret scanner on the changed file and warns if hardcoded values appeared.",
      },
      {
        name: "sessionStart",
        desc: "Loads the project context summary so the agent never starts a session blind.",
      },
    ],
  },
  {
    id: "mcp",
    Icon: Link2,
    title: "MCP Connector",
    count: 44,
    summary:
      "Auto-connects to qring-mcp via stdio. All 44 tools available in-IDE.",
    description: [
      "The plugin registers a stdio MCP connection to qring-mcp on session start, exposing every tool to the agent immediately. No extra config required.",
    ],
    assets: [
      { name: "qring-mcp", desc: "Stdio MCP server bundled with q-ring; auto-launched per session." },
      { name: ".cursor/mcp.json", desc: "Generated automatically by the plugin install step." },
    ],
  },
];
