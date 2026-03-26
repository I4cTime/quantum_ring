"use client";

import { useState, useCallback } from "react";

const commands: Record<string, string> = {
  pnpm: "pnpm add -g @i4ctime/q-ring",
  npm: "npm install -g @i4ctime/q-ring",
  yarn: "yarn global add @i4ctime/q-ring",
  bun: "bun add -g @i4ctime/q-ring",
  brew: "brew install i4ctime/tap/qring",
};

export default function Hero() {
  const [activePm, setActivePm] = useState("pnpm");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commands[activePm]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API may fail in insecure contexts */
    }
  }, [activePm]);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-12 md:pt-24 md:pb-12 overflow-hidden"
      id="hero"
    >
      {/* Background glow */}
      <div className="absolute w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,var(--color-accent-dim)_0%,transparent_70%)] blur-[80px] pointer-events-none z-0 animate-pulse-glow" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/social-card-optimized.jpg"
          alt="q-ring social card"
          className="max-w-[360px] h-auto rounded-lg mb-6 drop-shadow-[0_0_20px_var(--color-accent-dim)] animate-float mx-auto"
          width={360}
          height={200}
        />
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-extrabold tracking-tight leading-[1.1] mb-4">
          <span className="bg-gradient-to-br from-accent to-accent-bright bg-clip-text text-transparent drop-shadow-[0_0_20px_var(--color-accent-glow)]">
            q
          </span>
          -ring
        </h1>
        <p className="text-[clamp(1.1rem,2.5vw,1.4rem)] text-text-secondary font-light max-w-[560px] mx-auto mb-8 leading-relaxed">
          The first quantum-inspired keyring
          <br />
          built for AI coding agents.
        </p>

        {/* Install tabs */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center mb-3">
            {Object.keys(commands).map((pm) => (
              <button
                key={pm}
                className={`bg-transparent border font-[family-name:var(--font-mono)] text-sm px-3 py-1 rounded-sm cursor-pointer transition-all ${
                  pm === activePm
                    ? "text-accent-bright bg-bg-card border-border"
                    : "text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-card"
                }`}
                onClick={() => setActivePm(pm)}
              >
                {pm}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-3 bg-bg-card border border-border rounded-md px-5 py-3 font-[family-name:var(--font-mono)] text-[0.95rem] text-accent-bright transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_0_20px_var(--color-accent-dim)]">
            <code>{commands[activePm]}</code>
            <button
              className={`bg-transparent border-none cursor-pointer p-1 rounded transition-colors duration-200 flex items-center ${
                copied
                  ? "text-green"
                  : "text-text-dim hover:text-accent hover:bg-accent-dim"
              }`}
              onClick={handleCopy}
              aria-label="Copy install command"
            >
              {copied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 justify-center flex-wrap">
          {[
            { href: "https://www.npmjs.com/package/@i4ctime/q-ring", src: "https://img.shields.io/npm/v/@i4ctime/q-ring?style=flat-square&color=0ea5e9&label=npm", alt: "npm version" },
            { href: "https://github.com/I4cTime/quantum_ring", src: "https://img.shields.io/github/stars/I4cTime/quantum_ring?style=flat-square&color=0ea5e9&label=stars", alt: "GitHub stars" },
            { href: "https://github.com/I4cTime/quantum_ring/blob/main/LICENSE", src: "https://img.shields.io/badge/license-AGPL--3.0-0ea5e9?style=flat-square", alt: "AGPL-3.0 license" },
            { href: "https://ko-fi.com/i4ctime", src: "https://img.shields.io/badge/Ko--fi-Support-ff5e5b?style=flat-square&logo=ko-fi&logoColor=white", alt: "Ko-fi" },
          ].map((b) => (
            <a key={b.alt} href={b.href} className="group" target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.src} alt={b.alt} height={22} className="h-[22px] transition-transform duration-200 group-hover:-translate-y-0.5" />
            </a>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 text-text-dim text-xs uppercase tracking-widest animate-bob-down">
        <span>scroll</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="14" height="22" rx="7" />
          <line x1="8" y1="6" x2="8" y2="10" />
        </svg>
      </div>
    </section>
  );
}
