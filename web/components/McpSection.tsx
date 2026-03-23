"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";
import FadeIn from "@/components/motion/FadeIn";
import StaggerGroup, { itemVariants } from "@/components/motion/StaggerGroup";
import CopyableTerminal from "@/components/CopyableTerminal";

interface McpGroup {
  title: string;
  icon: ReactNode;
  tools: { name: string; desc: string }[];
}

const groups: McpGroup[] = [
  {
    title: "Core Tools",
    icon: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </>
    ),
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
    title: "Quantum Tools",
    icon: (
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    ),
    tools: [
      { name: "inspect_secret", desc: "Full quantum state inspection" },
      { name: "detect_environment", desc: "Wavefunction collapse" },
      { name: "generate_secret", desc: "Quantum noise generation" },
      { name: "entangle_secrets", desc: "Link for synchronized rotation" },
      { name: "disentangle_secrets", desc: "Remove entanglement link" },
    ],
  },
  {
    title: "Tunneling Tools",
    icon: (
      <>
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
      </>
    ),
    tools: [
      { name: "tunnel_create", desc: "Create ephemeral in-memory secret" },
      { name: "tunnel_read", desc: "Read (may self-destruct)" },
      { name: "tunnel_list", desc: "List active tunnels" },
      { name: "tunnel_destroy", desc: "Immediately destroy" },
    ],
  },
  {
    title: "Teleportation Tools",
    icon: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    tools: [
      { name: "teleport_pack", desc: "Encrypt into portable bundle" },
      { name: "teleport_unpack", desc: "Decrypt and import" },
    ],
  },
  {
    title: "Observer & Health",
    icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    tools: [
      { name: "audit_log", desc: "Query access history" },
      { name: "detect_anomalies", desc: "Scan for unusual patterns" },
      { name: "health_check", desc: "Full health report" },
      { name: "agent_scan", desc: "Autonomous agent scan" },
    ],
  },
  {
    title: "Validation Tools",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    tools: [
      { name: "validate_secret", desc: "Test if a secret is valid with its service" },
      { name: "list_providers", desc: "List available validation providers" },
    ],
  },
  {
    title: "Hook Tools",
    icon: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
    tools: [
      { name: "register_hook", desc: "Register a callback on secret changes" },
      { name: "list_hooks", desc: "List registered hooks" },
      { name: "remove_hook", desc: "Remove a hook by ID" },
    ],
  },
];

export default function McpSection() {
  return (
    <section className="py-24 relative z-1" id="mcp">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            MCP Integration
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            31 tools for seamless AI agent integration. Works with Cursor, Kiro,
            and Claude Code.
          </p>
        </FadeIn>

        <StaggerGroup className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 mb-12">
          {groups.map((g) => (
            <motion.div
              key={g.title}
              variants={itemVariants}
              className="bg-bg-card border border-border rounded-md p-6 flex flex-col h-full"
            >
              <h4 className="text-accent text-sm font-semibold uppercase tracking-wide mb-4 pb-2 border-b border-border flex items-center gap-2">
                <svg
                  className="w-[18px] h-[18px] shrink-0 drop-shadow-[0_0_6px_rgba(0,209,255,0.4)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#neon-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {g.icon}
                </svg>
                {g.title}
              </h4>
              <ul className="flex flex-col gap-2 flex-1">
                {g.tools.map((t) => (
                  <li
                    key={t.name}
                    className="text-text-secondary text-sm leading-snug grid grid-cols-[145px_1fr] items-start gap-3"
                  >
                    <span className="font-[family-name:var(--font-mono)] text-xs text-accent-bright bg-accent-dim px-2 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis">
                      {t.name}
                    </span>{" "}
                    {t.desc}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerGroup>

        <FadeIn>
          <h3 className="text-center text-[1.4rem] font-semibold mb-6 text-text-primary">
            Configuration
          </h3>
        </FadeIn>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          <FadeIn delay={0.1}>
            <ConfigBlock title="Cursor / Kiro" file=".cursor/mcp.json" />
          </FadeIn>
          <FadeIn delay={0.2}>
            <ConfigBlock title="Claude Code" file="claude_desktop_config.json" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function ConfigBlock({ title, file }: { title: string; file: string }) {
  return (
    <div>
      <h5 className="text-text-secondary text-sm font-medium mb-3 uppercase tracking-widest">
        {title}
      </h5>
      <CopyableTerminal title={file} maxWidth="100%">
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
  );
}
