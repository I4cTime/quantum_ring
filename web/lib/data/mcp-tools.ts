import {
  Activity,
  Bell,
  Box,
  Cpu,
  Ghost,
  type LucideIcon,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

export type McpTool = {
  name: string;
  desc: string;
};

export type McpGroup = {
  id: string;
  title: string;
  Icon: LucideIcon;
  tools: McpTool[];
};

export const MCP_GROUPS: McpGroup[] = [
  {
    id: "core",
    title: "Core Tools",
    Icon: Box,
    tools: [
      { name: "get_secret", desc: "Retrieve with superposition collapse + observer logging" },
      { name: "list_secrets", desc: "List keys with quantum metadata" },
      { name: "set_secret", desc: "Store with optional TTL, env state, tags" },
      { name: "delete_secret", desc: "Remove a secret" },
      { name: "has_secret", desc: "Boolean check (respects decay)" },
      { name: "export_secrets", desc: "Export as .env/JSON with key and tag filters" },
      { name: "import_dotenv", desc: "Parse and import secrets from .env content" },
      { name: "check_project", desc: "Validate secrets against .q-ring.json manifest" },
      { name: "env_generate", desc: "Generate .env from project manifest" },
    ],
  },
  {
    id: "quantum",
    title: "Quantum Tools",
    Icon: Sparkles,
    tools: [
      { name: "inspect_secret", desc: "Full quantum state inspection" },
      { name: "detect_environment", desc: "Wavefunction collapse" },
      { name: "generate_secret", desc: "Quantum noise generation" },
      { name: "entangle_secrets", desc: "Link for synchronized rotation" },
      { name: "disentangle_secrets", desc: "Remove entanglement link" },
    ],
  },
  {
    id: "tunneling",
    title: "Tunneling Tools",
    Icon: Ghost,
    tools: [
      { name: "tunnel_create", desc: "Create ephemeral in-memory secret" },
      { name: "tunnel_read", desc: "Read (may self-destruct)" },
      { name: "tunnel_list", desc: "List active tunnels" },
      { name: "tunnel_destroy", desc: "Immediately destroy" },
    ],
  },
  {
    id: "teleport",
    title: "Teleportation Tools",
    Icon: Send,
    tools: [
      { name: "teleport_pack", desc: "Encrypt into portable bundle" },
      { name: "teleport_unpack", desc: "Decrypt and import" },
    ],
  },
  {
    id: "observer",
    title: "Observer & Health",
    Icon: Activity,
    tools: [
      { name: "audit_log", desc: "Query access history" },
      { name: "detect_anomalies", desc: "Scan for unusual patterns" },
      { name: "verify_audit_chain", desc: "Verify tamper-evident hash chain" },
      { name: "export_audit", desc: "Export audit events (jsonl/json/csv)" },
      { name: "health_check", desc: "Full health report" },
      { name: "status_dashboard", desc: "Launch live status dashboard (KPIs, secrets, policy, approvals, audit)" },
      { name: "agent_scan", desc: "Autonomous agent scan" },
    ],
  },
  {
    id: "validation",
    title: "Validation Tools",
    Icon: ShieldCheck,
    tools: [
      { name: "validate_secret", desc: "Test if a secret is valid with its service" },
      { name: "list_providers", desc: "List available validation providers" },
    ],
  },
  {
    id: "hooks",
    title: "Hook Tools",
    Icon: Bell,
    tools: [
      { name: "register_hook", desc: "Register a callback on secret changes" },
      { name: "list_hooks", desc: "List registered hooks" },
      { name: "remove_hook", desc: "Remove a hook by ID" },
    ],
  },
  {
    id: "execution",
    title: "Execution & Scanning",
    Icon: TerminalSquare,
    tools: [
      { name: "exec_with_secrets", desc: "Run commands with injected secrets and auto-redacted output" },
      { name: "scan_codebase_for_secrets", desc: "Scan directories for hardcoded secrets via entropy analysis" },
      { name: "lint_files", desc: "Lint files for hardcoded secrets with optional auto-fix" },
    ],
  },
  {
    id: "agent",
    title: "AI Agent Tools",
    Icon: Cpu,
    tools: [
      { name: "get_project_context", desc: "Safe, redacted overview for agent system prompts" },
      { name: "agent_remember", desc: "Store key-value in encrypted agent memory" },
      { name: "agent_recall", desc: "Retrieve from agent memory or list all keys" },
      { name: "agent_forget", desc: "Delete a key from agent memory" },
      { name: "analyze_secrets", desc: "Usage analytics and rotation recommendations" },
    ],
  },
  {
    id: "governance",
    title: "Governance & Policy",
    Icon: Shield,
    tools: [
      { name: "check_policy", desc: "Check if an action is allowed by project policy" },
      { name: "get_policy_summary", desc: "Get governance policy configuration summary" },
      { name: "rotate_secret", desc: "Attempt issuer-native rotation via provider" },
      { name: "ci_validate_secrets", desc: "CI batch validation with structured pass/fail" },
    ],
  },
];

export const MCP_TOOL_COUNT = MCP_GROUPS.reduce(
  (acc, g) => acc + g.tools.length,
  0,
);
