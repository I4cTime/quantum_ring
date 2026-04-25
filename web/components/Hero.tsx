"use client";

import { useState, type Key } from "react";
import NextLink from "next/link";
import { Chip, Tabs } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ArrowRight, Mouse, Sparkles } from "lucide-react";

import TerminalCard from "@/components/TerminalCard";
import { BrandGithub } from "@/components/icons/BrandIcons";
import {
  INSTALL_COMMANDS,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "@/lib/data/install";

const BADGES = [
  {
    href: "https://www.npmjs.com/package/@i4ctime/q-ring",
    src: "https://img.shields.io/npm/v/@i4ctime/q-ring?style=flat-square&color=0ea5e9&label=npm",
    alt: "npm version",
  },
  {
    href: "https://github.com/I4cTime/quantum_ring",
    src: "https://img.shields.io/github/stars/I4cTime/quantum_ring?style=flat-square&color=0ea5e9&label=stars",
    alt: "GitHub stars",
  },
  {
    href: "https://github.com/I4cTime/quantum_ring/blob/main/LICENSE",
    src: "https://img.shields.io/badge/license-AGPL--3.0-0ea5e9?style=flat-square",
    alt: "AGPL-3.0 license",
  },
  {
    href: "https://ko-fi.com/i4ctime",
    src: "https://img.shields.io/badge/Ko--fi-Support-ff5e5b?style=flat-square&logo=ko-fi&logoColor=white",
    alt: "Ko-fi",
  },
] as const;

export default function Hero() {
  const [activePm, setActivePm] = useState<PackageManager>("pnpm");

  return (
    <section
      className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 pt-28 pb-32 sm:pb-36 overflow-hidden"
      id="hero"
    >
      <div className="absolute w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,var(--color-accent-dim)_0%,transparent_70%)] blur-[80px] pointer-events-none z-0 animate-pulse-glow" />

      <div className="max-w-[1200px] mx-auto relative z-1 flex flex-col items-center gap-6">
        <Chip
          variant="soft"
          size="sm"
          className="border border-border/70 bg-bg-card/60 text-text-secondary backdrop-blur"
        >
          <Sparkles className="size-3.5 text-accent-bright" aria-hidden />
          <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-widest">
            v0.11 · MCP-native · AGPL-3.0
          </span>
        </Chip>

        <h1 className="sr-only">q-ring — Quantum Keyring for AI Agents</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/social-card-optimized.jpg"
          alt="q-ring — quantum keyring for AI agents"
          width={1376}
          height={768}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="w-full max-w-[480px] sm:max-w-[640px] md:max-w-[720px] h-auto rounded-2xl border border-border/60 shadow-[0_20px_80px_-20px_rgba(14,165,233,0.45)] drop-shadow-[0_0_30px_var(--color-accent-dim)] animate-float"
        />

        <p className="text-[clamp(1.1rem,2.5vw,1.4rem)] text-text-secondary font-light max-w-[640px] leading-relaxed">
          The first quantum-inspired keyring built for AI coding agents.{" "}
          <span className="text-text-primary">Anchor secrets to your OS vault</span>{" "}
          — never paste another API key into <code>.env</code>.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <NextLink
            href="/docs#quickstart"
            className={`${buttonVariants({ variant: "primary", size: "lg" })} font-semibold`}
          >
            Quick start
            <ArrowRight className="size-4" aria-hidden />
          </NextLink>

          <a
            href="https://github.com/I4cTime/quantum_ring"
            target="_blank"
            rel="noopener"
            className={`${buttonVariants({ variant: "outline", size: "lg" })} font-semibold`}
          >
            <BrandGithub className="size-4" />
            Star on GitHub
          </a>
        </div>

        <div className="w-full max-w-[640px] mt-6">
          <Tabs
            aria-label="Install command"
            selectedKey={activePm}
            onSelectionChange={(key: Key) => setActivePm(key as PackageManager)}
            variant="secondary"
            className="w-full"
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="Package manager"
                className="justify-center"
              >
                {PACKAGE_MANAGERS.map((pm) => (
                  <Tabs.Tab
                    key={pm}
                    id={pm}
                    className="!w-auto font-[family-name:var(--font-mono)] text-sm"
                  >
                    {pm}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
            {PACKAGE_MANAGERS.map((pm) => (
              <Tabs.Panel key={pm} id={pm} className="pt-3">
                <TerminalCard
                  title="Install"
                  copyText={INSTALL_COMMANDS[pm]}
                  maxWidth="640px"
                >
                  <pre className="m-0">
                    <span className="text-text-dim">$ </span>
                    <span className="text-accent-bright">{INSTALL_COMMANDS[pm]}</span>
                  </pre>
                </TerminalCard>
              </Tabs.Panel>
            ))}
          </Tabs>
        </div>

        <div className="flex gap-2 justify-center flex-wrap mt-2">
          {BADGES.map((b) => (
            <a
              key={b.alt}
              href={b.href}
              className="group"
              target="_blank"
              rel="noopener"
              aria-label={b.alt}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.src}
                alt={b.alt}
                height={22}
                className="h-[22px] transition-transform duration-200 group-hover:-translate-y-0.5"
              />
            </a>
          ))}
        </div>

      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-text-dim text-[0.65rem] uppercase tracking-widest animate-bob-down">
        <span>scroll</span>
        <Mouse className="w-4 h-5" aria-hidden />
      </div>
    </section>
  );
}
