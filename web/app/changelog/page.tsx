import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/motion/FadeIn";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog — q-ring",
  description: "Version history and release notes for q-ring.",
};

interface ChangelogEntry {
  version: string;
  date: string;
  highlights: { type: "added" | "changed" | "fixed" | "security"; text: string }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "0.9.0",
    date: "2026-03-22",
    highlights: [
      { type: "added", text: "Composite / Templated Secrets — `{{OTHER_KEY}}` placeholders in connection strings resolve dynamically on read" },
      { type: "added", text: "User Approvals (Zero-Trust Agent) — HMAC-verified, scoped, time-limited approval tokens for sensitive MCP reads" },
      { type: "added", text: "JIT Provisioning — dynamically generate short-lived tokens on read (AWS STS, Generic HTTP)" },
      { type: "added", text: "Secure Execution & Auto-Redaction — `qring exec` injects secrets with automatic stdout/stderr redaction" },
      { type: "added", text: "Exec Profiles — `unrestricted`, `restricted`, and `ci` profiles for command execution policy" },
      { type: "added", text: "Codebase Secret Scanner — `qring scan` detects hardcoded credentials via regex + Shannon entropy" },
      { type: "added", text: "Secret-Aware Linter — `qring lint --fix` auto-replaces hardcoded values with `process.env.KEY` references" },
      { type: "added", text: "Agent Memory — encrypted persistent key-value store across AI agent sessions" },
      { type: "added", text: "Project Context — safe, redacted project overview for agent system prompts" },
      { type: "added", text: "Pre-Commit Secret Scanning — `qring hook:install` blocks commits containing hardcoded secrets" },
      { type: "added", text: "Secret Analytics — `qring analyze` reports usage patterns and rotation recommendations" },
      { type: "added", text: "Service Setup Wizard — `qring wizard` scaffolds service integrations in one command" },
      { type: "added", text: "Governance Policy — `.q-ring.json` policy engine for MCP tool gating, key access, and exec restrictions" },
      { type: "added", text: "Team & Org Scopes — `--team` and `--org` flags with cascade resolution (project → team → org → global)" },
      { type: "added", text: "Issuer-Native Rotation — `qring rotate` attempts provider-native rotation before falling back to local generation" },
      { type: "added", text: "CI Secret Validation — `qring ci:validate` batch-validates all secrets with structured pass/fail output" },
      { type: "added", text: "Tamper-Evident Audit — `qring audit:verify` checks SHA-256 chain integrity; `qring audit:export` outputs jsonl/json/csv" },
      { type: "added", text: "Shared HTTP client for validation/hooks; SSRF mitigation for HTTP hooks (private IP block; Q_RING_ALLOW_PRIVATE_HOOKS override)" },
      { type: "added", text: "Next.js site refresh — Tailwind v4, Motion, /docs, /changelog, mobile nav, copyable terminals, stats, interactive architecture" },
      { type: "changed", text: "MCP server tool count increased from 31 to 44" },
      { type: "changed", text: "Dashboard routing, SSE backpressure, CORS, offline-safe HTML" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-03-22",
    highlights: [
      { type: "added", text: "Secret Liveness Validation — `qring validate` tests secrets against live services (OpenAI, Stripe, GitHub, AWS, Generic HTTP)" },
      { type: "added", text: "Hooks on Secret Change — shell commands, HTTP webhooks, or process signals on write/delete/rotate" },
      { type: "added", text: "`.env` file import — `qring import .env` parses dotenv syntax and bulk-stores secrets" },
      { type: "added", text: "Project Secret Manifest — `.q-ring.json` for declaring required secrets" },
      { type: "added", text: "Env File Sync — `qring env:generate` produces .env from manifest" },
      { type: "added", text: "Disentangle command, Selective export, branchMap globs, Configurable rotation, Secret search/filtering" },
      { type: "changed", text: "MCP tool count increased from 20 to 31" },
    ],
  },
  {
    version: "0.3.2",
    date: "2026-03-21",
    highlights: [
      { type: "security", text: "Resolved 8 CodeQL `js/clear-text-logging` alerts by sanitizing keyring metadata" },
    ],
  },
  {
    version: "0.3.1",
    date: "2026-03-21",
    highlights: [
      { type: "fixed", text: "Dashboard re-rendering — cards now update in-place via differential DOM patching" },
      { type: "fixed", text: "Audit log noise — `qring list` from dashboard no longer generates audit entries" },
      { type: "changed", text: "Increased dashboard font sizes for readability" },
      { type: "changed", text: "Replaced dashboard header icon with project icon" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-03-21",
    highlights: [
      { type: "added", text: "Quantum Status Dashboard — live SSE dashboard with 8 panels at `qring status`" },
      { type: "added", text: "MCP `status_dashboard` tool for AI agents" },
      { type: "added", text: "MCP Registry support, GitHub issue templates, SECURITY.md" },
      { type: "fixed", text: "Shebang and bin paths corrected" },
    ],
  },
  {
    version: "0.2.7",
    date: "2026-03-20",
    highlights: [
      { type: "added", text: "Initial public release with quantum keyring core, MCP server (20 tools), and CLI" },
      { type: "added", text: "Superposition, entanglement, tunneling, teleportation, decay, observer, and agent features" },
      { type: "added", text: "GitHub Pages landing site, Glama integration" },
    ],
  },
];

const typeColors: Record<string, string> = {
  added: "bg-green/20 text-green border-green/30",
  changed: "bg-accent/20 text-accent border-accent/30",
  fixed: "bg-warning/20 text-warning border-warning/30",
  security: "bg-danger/20 text-danger border-danger/30",
};

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-24 pb-16 relative z-1">
        <div className="max-w-[800px] mx-auto px-6">
          <FadeIn>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-accent mb-8 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to home
            </Link>
          </FadeIn>

          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
              Changelog
            </h1>
            <p className="text-text-secondary text-lg mb-12 leading-relaxed">
              A record of every release, feature, and fix.
            </p>
          </FadeIn>

          <div className="border-l-2 border-border pl-8 relative">
            {changelog.map((entry, i) => (
              <FadeIn key={entry.version} delay={i * 0.08}>
                <div className="mb-12 relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[calc(2rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]" />

                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="font-[family-name:var(--font-mono)] text-lg font-bold text-text-primary">
                      v{entry.version}
                    </span>
                    <span className="text-sm text-text-dim">
                      {entry.date}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {entry.highlights.map((h, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase shrink-0 mt-0.5 border ${typeColors[h.type]}`}
                        >
                          {h.type}
                        </span>
                        <span className="text-text-secondary leading-relaxed">
                          {h.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
