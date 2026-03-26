"use client";

import { motion } from "motion/react";
import FadeIn from "@/components/motion/FadeIn";
import StaggerGroup, { itemVariants } from "@/components/motion/StaggerGroup";
import CopyableTerminal from "@/components/CopyableTerminal";

const pluginComponents = [
  {
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </>
    ),
    title: "3 Rules",
    desc: "Always-on guidance: secret hygiene, q-ring workflow, and .env file safety.",
  },
  {
    icon: (
      <>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </>
    ),
    title: "4 Skills",
    desc: "Auto-triggered by context: management, scanning, rotation, and project onboarding.",
  },
  {
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    title: "2 Agents",
    desc: "Security auditor for proactive monitoring and secret-ops for daily management.",
  },
  {
    icon: (
      <>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </>
    ),
    title: "5 Commands",
    desc: "Scan secrets, health check, rotate expired, setup project, and teleport.",
  },
  {
    icon: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
    title: "2 Hooks",
    desc: "After file edit scan and session start project context loading.",
  },
  {
    icon: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    title: "MCP Connector",
    desc: "Auto-connects to qring-mcp via stdio. All 44 tools available in-IDE.",
  },
];

export default function CursorPlugin() {
  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="cursor-plugin">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Cursor Plugin
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            Quantum secret management built into your IDE. Rules, skills, agents,
            commands, and hooks — all powered by q-ring&apos;s 44 MCP tools.
          </p>
        </FadeIn>
        <StaggerGroup className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 mb-10">
          {pluginComponents.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              whileHover={{
                scale: 1.03,
                transition: { type: "spring", stiffness: 400, damping: 25 },
              }}
              className="bg-bg-card border border-border rounded-md p-6 text-center transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_8px_32px_rgba(14,165,233,0.1)]"
            >
              <svg
                className="w-10 h-10 mb-3 mx-auto drop-shadow-[0_0_6px_rgba(0,209,255,0.5)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#neon-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icon}
              </svg>
              <h4 className="text-base font-semibold mb-2 text-text-primary">
                {f.title}
              </h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </StaggerGroup>
        <FadeIn delay={0.2}>
          <CopyableTerminal title="~ / install" maxWidth="600px">
            <pre>
              <span className="text-[#555]">
                # Install from the Cursor marketplace, or manually:
              </span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">
                cp -r cursor-plugin/ ~/.cursor/plugins/qring/
              </span>
            </pre>
          </CopyableTerminal>
        </FadeIn>
      </div>
    </section>
  );
}
