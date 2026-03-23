"use client";

import { useState, useCallback } from "react";

const commands: Record<string, string> = {
  pnpm: "pnpm add -g @i4ctime/q-ring",
  npm: "npm install -g @i4ctime/q-ring",
  yarn: "yarn global add @i4ctime/q-ring",
  bun: "bun add -g @i4ctime/q-ring",
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
    <section className="hero" id="hero">
      <div className="hero-glow" />
      <div className="container hero-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/quantum_ring/assets/social-card-optimized.jpg"
          alt="q-ring social card"
          className="hero-logo reveal"
          width={360}
          height={200}
        />
        <h1 className="hero-title reveal">
          <span className="hero-q">q</span>-ring
        </h1>
        <p className="hero-tagline reveal">
          The first quantum-inspired keyring
          <br />
          built for AI coding agents.
        </p>
        <div className="hero-install reveal">
          <div className="pkg-tabs">
            {Object.keys(commands).map((pm) => (
              <button
                key={pm}
                className={`pkg-tab${pm === activePm ? " active" : ""}`}
                onClick={() => setActivePm(pm)}
              >
                {pm}
              </button>
            ))}
          </div>
          <div className="install-box" id="install-box">
            <code id="install-code">{commands[activePm]}</code>
            <button
              className={`copy-btn${copied ? " copied" : ""}`}
              onClick={handleCopy}
              aria-label="Copy install command"
            >
              {copied ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="hero-badges reveal">
          <a
            href="https://www.npmjs.com/package/@i4ctime/q-ring"
            className="badge"
            target="_blank"
            rel="noopener"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/npm/v/@i4ctime/q-ring?style=flat-square&color=0ea5e9&label=npm"
              alt="npm version"
              height={22}
            />
          </a>
          <a
            href="https://github.com/I4cTime/quantum_ring"
            className="badge"
            target="_blank"
            rel="noopener"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/github/stars/I4cTime/quantum_ring?style=flat-square&color=0ea5e9&label=stars"
              alt="GitHub stars"
              height={22}
            />
          </a>
          <a
            href="https://github.com/I4cTime/quantum_ring/blob/main/LICENSE"
            className="badge"
            target="_blank"
            rel="noopener"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/badge/license-AGPL--3.0-0ea5e9?style=flat-square"
              alt="AGPL-3.0 license"
              height={22}
            />
          </a>
          <a
            href="https://ko-fi.com/i4cdeath"
            className="badge"
            target="_blank"
            rel="noopener"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/badge/Ko--fi-Support-ff5e5b?style=flat-square&logo=ko-fi&logoColor=white"
              alt="Ko-fi"
              height={22}
            />
          </a>
        </div>
      </div>
      <div className="hero-scroll-hint reveal">
        <span>scroll</span>
        <svg
          width="16"
          height="24"
          viewBox="0 0 16 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="1" y="1" width="14" height="22" rx="7" />
          <line x1="8" y1="6" x2="8" y2="10" />
        </svg>
      </div>
    </section>
  );
}
