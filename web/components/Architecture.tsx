"use client";

import { motion } from "motion/react";
import { Chip } from "@heroui/react";
import { HoverCard } from "@heroui-pro/react";
import { ArrowRight, Cpu, Database, Server, Terminal } from "lucide-react";

import FadeIn from "@/components/motion/FadeIn";

type Module = {
  name: string;
  desc: string;
  section?: string;
};

const MODULES: Module[] = [
  { name: "Envelope", desc: "AES-256-GCM encrypted secret wrapper with metadata", section: "features" },
  { name: "Scope", desc: "Environment-aware secret resolution (global/project/team/org)", section: "features" },
  { name: "Collapse", desc: "Wavefunction collapse for automatic env detection", section: "features" },
  { name: "Observer", desc: "Tamper-evident audit chain and access pattern tracking", section: "features" },
  { name: "Policy", desc: "Governance-as-code engine for MCP/key/exec rules", section: "features" },
  { name: "Noise", desc: "Cryptographically strong secret generation", section: "features" },
  { name: "Entanglement", desc: "Synchronized secret rotation across projects", section: "features" },
  { name: "Validate", desc: "Provider-based liveness validation and rotation", section: "features" },
  { name: "Hooks", desc: "Shell, HTTP, and signal callbacks on secret changes", section: "features" },
  { name: "Import", desc: "Bulk .env file import with dotenv parsing", section: "features" },
  { name: "Exec", desc: "Profile-restricted secret injection with auto-redaction", section: "features" },
  { name: "Scan", desc: "Codebase entropy heuristics for hardcoded secrets", section: "features" },
  { name: "Provision", desc: "JIT ephemeral credential generation (AWS STS, HTTP)", section: "features" },
  { name: "Approval", desc: "HMAC-verified zero-trust approval tokens", section: "features" },
  { name: "Context", desc: "Safe redacted project overview for AI agents", section: "features" },
  { name: "Linter", desc: "Secret-aware code scanning with auto-fix", section: "features" },
  { name: "Memory", desc: "Encrypted persistent agent key-value store", section: "features" },
  { name: "Tunnel", desc: "Ephemeral in-memory secrets with self-destruct", section: "features" },
  { name: "Teleport", desc: "Encrypted bundle transfer between machines", section: "features" },
  { name: "Agent", desc: "Autonomous background daemon for monitoring", section: "agent" },
  { name: "Dashboard", desc: "Live SSE dashboard with 8 monitoring panels", section: "dashboard" },
];

export default function Architecture() {
  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="architecture">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Under the hood
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Architecture
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            A modular core engine bridging CLI and MCP to your OS-native keyring.
            Hover any module to see what it does.
          </p>
        </div>

        <FadeIn delay={0.1}>
          <div className="flex items-stretch justify-center gap-6 flex-wrap py-6 max-md:flex-col max-md:items-center">
            <Column>
              <SurfaceCard
                Icon={Terminal}
                label="qring CLI"
                tone="text-accent-bright"
              />
              <SurfaceCard
                Icon={Server}
                label="MCP Server"
                tone="text-warning"
              />
            </Column>

            <FlowArrow delay={0} />

            <Column className="items-center">
              <SurfaceCard
                Icon={Cpu}
                label="Core Engine"
                tone="text-accent"
                emphasized
              />
              <div className="flex flex-wrap gap-1.5 justify-center max-w-[320px]">
                {MODULES.map((m) => (
                  <ModuleChip key={m.name} module={m} />
                ))}
              </div>
            </Column>

            <FlowArrow delay={0.5} />

            <Column>
              <SurfaceCard
                Icon={Database}
                label="@napi-rs/keyring"
                tone="text-emerald-400"
              />
              <SurfaceCard
                Icon={Database}
                label="OS Keyring"
                tone="text-text-primary"
                bordered="emerald"
              />
            </Column>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function Column({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 items-center ${className}`}>
      {children}
    </div>
  );
}

function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.div
      className="text-accent drop-shadow-[0_0_6px_var(--color-accent-glow)] max-md:rotate-90 self-center"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <ArrowRight className="size-6" strokeWidth={2.5} aria-hidden />
    </motion.div>
  );
}

function SurfaceCard({
  Icon,
  label,
  tone,
  emphasized,
  bordered,
}: {
  Icon: React.ElementType;
  label: string;
  tone: string;
  emphasized?: boolean;
  bordered?: "emerald";
}) {
  const borderClass = emphasized
    ? "border-accent"
    : bordered === "emerald"
      ? "border-emerald-500"
      : "border-border";
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className={`bg-bg-card border ${borderClass} rounded-md px-5 py-3 font-[family-name:var(--font-mono)] ${
        emphasized ? "text-base font-bold" : "text-sm font-medium"
      } ${tone} flex items-center gap-2 whitespace-nowrap transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_0_16px_var(--color-accent-dim)] cursor-default`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </motion.div>
  );
}

function ModuleChip({ module }: { module: Module }) {
  const onActivate = () => {
    if (module.section) {
      document
        .getElementById(module.section)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <HoverCard openDelay={150} closeDelay={120}>
      <HoverCard.Trigger>
        <button
          type="button"
          onClick={onActivate}
          className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
        >
          <Chip
            variant="soft"
            size="sm"
            className="font-[family-name:var(--font-mono)] text-[0.7rem] bg-accent-dim text-accent-bright hover:bg-accent/25 transition-colors"
          >
            {module.name}
          </Chip>
        </button>
      </HoverCard.Trigger>
      <HoverCard.Content
        placement="top"
        className="max-w-[280px] bg-bg-deep border border-border text-text-secondary text-xs px-3 py-2 rounded-md shadow-lg"
      >
        <HoverCard.Arrow />
        <p className="text-text-primary font-medium text-sm mb-1">
          {module.name}
        </p>
        <p className="leading-relaxed">{module.desc}</p>
      </HoverCard.Content>
    </HoverCard>
  );
}
