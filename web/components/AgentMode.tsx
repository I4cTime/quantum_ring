"use client";

import { motion } from "motion/react";
import FadeIn from "@/components/motion/FadeIn";
import StaggerGroup, { itemVariants } from "@/components/motion/StaggerGroup";
import CopyableTerminal from "@/components/CopyableTerminal";

const agents = [
  {
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    title: "Continuous Monitoring",
    desc: "Scans secret health at configurable intervals. Detects expiration, anomalies, and staleness.",
  },
  {
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    title: "Auto-Rotation",
    desc: "Automatically regenerates expired secrets using quantum noise. Zero downtime key rotation.",
  },
  {
    icon: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    title: "Anomaly Detection",
    desc: "Tracks access patterns and flags burst access, unusual hours, and suspicious behavior.",
  },
];

export default function AgentMode() {
  return (
    <section className="py-24 relative z-1" id="agent">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Agent Mode
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            Autonomous background daemon that guards your secrets 24/7.
          </p>
        </FadeIn>
        <StaggerGroup className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mb-8">
          {agents.map((a) => (
            <motion.div
              key={a.title}
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              className="bg-bg-card border border-border rounded-md p-6 text-center transition-[border-color] duration-300 hover:border-border-glow"
            >
              <svg
                className="w-12 h-12 mb-4 mx-auto drop-shadow-[0_0_8px_rgba(0,209,255,0.6)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#neon-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {a.icon}
              </svg>
              <h4 className="text-base font-semibold mb-2">{a.title}</h4>
              <p className="text-text-secondary text-sm">{a.desc}</p>
            </motion.div>
          ))}
        </StaggerGroup>
        <FadeIn delay={0.2}>
          <CopyableTerminal title="~ / agent" maxWidth="600px">
            <pre>
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring agent</span> --interval 60
              --auto-rotate --verbose
            </pre>
          </CopyableTerminal>
        </FadeIn>
      </div>
    </section>
  );
}
