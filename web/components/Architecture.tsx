"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import FadeIn from "@/components/motion/FadeIn";

const modules: { name: string; desc: string; section?: string }[] = [
  { name: "Envelope", desc: "AES-256-GCM encrypted secret wrapper with metadata", section: "features" },
  { name: "Scope", desc: "Environment-aware secret resolution (dev/staging/prod)", section: "features" },
  { name: "Collapse", desc: "Wavefunction collapse for automatic env detection", section: "features" },
  { name: "Observer", desc: "Audit logging and access pattern tracking", section: "features" },
  { name: "Noise", desc: "Cryptographically strong secret generation", section: "features" },
  { name: "Entanglement", desc: "Synchronized secret rotation across projects", section: "features" },
  { name: "Validate", desc: "Liveness validation against target services", section: "features" },
  { name: "Hooks", desc: "Shell, HTTP, and signal callbacks on secret changes", section: "features" },
  { name: "Import", desc: "Bulk .env file import with dotenv parsing", section: "features" },
  { name: "Tunnel", desc: "Ephemeral in-memory secrets with self-destruct", section: "features" },
  { name: "Teleport", desc: "Encrypted bundle transfer between machines", section: "features" },
  { name: "Agent", desc: "Autonomous background daemon for monitoring", section: "agent" },
  { name: "Dashboard", desc: "Live SSE dashboard with 8 monitoring panels", section: "dashboard" },
];

export default function Architecture() {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="architecture">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Architecture
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            A modular core engine bridging CLI and MCP to your OS-native keyring.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex items-center justify-center gap-6 flex-wrap py-8 max-md:flex-col">
            {/* Entry */}
            <div className="flex flex-col gap-3 items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-bg-card border border-border rounded-sm px-6 py-3 font-[family-name:var(--font-mono)] text-sm font-medium text-center whitespace-nowrap transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_0_16px_var(--color-accent-dim)] text-accent-bright cursor-default"
              >
                qring CLI
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-bg-card border border-border rounded-sm px-6 py-3 font-[family-name:var(--font-mono)] text-sm font-medium text-center whitespace-nowrap transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_0_16px_var(--color-accent-dim)] text-warning cursor-default"
              >
                MCP Server
              </motion.div>
            </div>

            {/* Arrow */}
            <motion.div
              className="text-accent text-2xl drop-shadow-[0_0_6px_var(--color-accent-glow)] max-md:rotate-90"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </motion.div>

            {/* Core */}
            <div className="flex flex-col gap-3 items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-bg-card border border-accent rounded-sm px-6 py-3 font-[family-name:var(--font-mono)] text-base font-bold text-center whitespace-nowrap transition-[border-color,box-shadow] duration-300 hover:shadow-[0_0_16px_var(--color-accent-dim)] text-accent cursor-default"
              >
                Core Engine
              </motion.div>
              <div className="flex flex-wrap gap-1.5 justify-center max-w-[280px] relative">
                {modules.map((m) => (
                  <div key={m.name} className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onMouseEnter={() => setHoveredModule(m.name)}
                      onMouseLeave={() => setHoveredModule(null)}
                      onClick={() => {
                        if (m.section) {
                          document.getElementById(m.section)?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="bg-accent-dim text-accent-bright font-[family-name:var(--font-mono)] text-[0.7rem] px-2.5 py-0.5 rounded border border-[rgba(14,165,233,0.2)] cursor-pointer hover:border-accent-bright hover:bg-accent/20 transition-colors"
                    >
                      {m.name}
                    </motion.button>
                    <AnimatePresence>
                      {hoveredModule === m.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-bg-deep border border-border rounded text-xs text-text-secondary whitespace-nowrap z-10 shadow-lg pointer-events-none"
                        >
                          {m.desc}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <motion.div
              className="text-accent text-2xl drop-shadow-[0_0_6px_var(--color-accent-glow)] max-md:rotate-90"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </motion.div>

            {/* Exit */}
            <div className="flex flex-col gap-3 items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-bg-card border border-border rounded-sm px-6 py-3 font-[family-name:var(--font-mono)] text-sm font-medium text-center whitespace-nowrap transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_0_16px_var(--color-accent-dim)] text-green cursor-default"
              >
                @napi-rs/keyring
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-bg-card border border-green rounded-sm px-6 py-3 font-[family-name:var(--font-mono)] text-sm font-medium text-center whitespace-nowrap transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_0_16px_var(--color-accent-dim)] text-text-primary cursor-default"
              >
                OS Keyring
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
