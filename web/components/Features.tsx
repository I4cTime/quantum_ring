"use client";

import { motion } from "motion/react";
import FadeIn from "@/components/motion/FadeIn";
import StaggerGroup, { itemVariants } from "@/components/motion/StaggerGroup";

const features = [
  {
    icon: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 12 12 17 22 12" />
        <polyline points="2 17 12 22 22 17" />
      </>
    ),
    title: "Superposition",
    desc: "One key holds values for dev, staging, and prod simultaneously. The correct value resolves based on your current context.",
    cmd: 'qring set API_KEY "sk-dev" --env dev',
  },
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    title: "Wavefunction Collapse",
    desc: "Auto-detects your environment from flags, env vars, git branches, and project config. Zero manual switching.",
    cmd: "qring env",
  },
  {
    icon: (
      <>
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </>
    ),
    title: "Quantum Decay",
    desc: "Secrets with TTL. Expired secrets are blocked, stale ones trigger warnings. Set explicit expiry or time-to-live.",
    cmd: 'qring set TOKEN "tok-..." --ttl 3600',
  },
  {
    icon: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    title: "Observer Effect",
    desc: "Every read, write, and delete is logged. Access patterns are tracked for anomaly detection and audit trails.",
    cmd: "qring audit --anomalies",
  },
  {
    icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    title: "Quantum Noise",
    desc: "Generate cryptographically strong secrets in API key, password, UUID, token, or hex formats.",
    cmd: "qring generate --format api-key",
  },
  {
    icon: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    title: "Entanglement",
    desc: "Link secrets across projects. When you rotate one, all entangled copies update automatically.",
    cmd: "qring entangle API_KEY API_KEY_BACKUP",
  },
  {
    icon: (
      <>
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
      </>
    ),
    title: "Tunneling",
    desc: "Ephemeral secrets that exist only in memory. Never touch disk. Optional TTL and max-read self-destruction.",
    cmd: 'qring tunnel create "temp-tok" --max-reads 1',
  },
  {
    icon: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    title: "Teleportation",
    desc: "Pack secrets into AES-256-GCM encrypted bundles for secure transfer between machines.",
    cmd: 'qring teleport pack --keys "API_KEY"',
  },
  {
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    title: "Liveness Validation",
    desc: "Test if a secret is actually valid with its target service. Auto-detects OpenAI, Stripe, GitHub, and AWS from key prefixes.",
    cmd: "qring validate --all",
  },
  {
    icon: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
    title: "Hooks",
    desc: 'Register shell commands, HTTP webhooks, or process signals that fire when secrets are written, deleted, or rotated.',
    cmd: 'qring hook add --key DB_PASS --exec "..."',
  },
  {
    icon: (
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
    title: "Project Manifest",
    desc: "Declare required secrets in .q-ring.json and validate project readiness with a single command.",
    cmd: "qring check",
  },
  {
    icon: (
      <>
        <path d="M12 3v12" />
        <path d="m8 11 4 4 4-4" />
        <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
      </>
    ),
    title: "Import",
    desc: "Migrate from .env files in one command. Supports standard dotenv syntax with comments, quotes, and escape sequences.",
    cmd: "qring import .env --skip-existing",
  },
  {
    icon: (
      <>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
      </>
    ),
    title: "Env Sync",
    desc: "Generate .env files from the project manifest, resolving each key with environment-aware superposition collapse.",
    cmd: "qring env:generate --output .env",
  },
  {
    icon: (
      <>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </>
    ),
    title: "Secure Execution",
    desc: "Run commands with secrets injected into the environment. All known values are auto-redacted from stdout and stderr.",
    cmd: "qring exec -- npm run deploy",
  },
  {
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    title: "Codebase Scanner",
    desc: "Detect hardcoded credentials using regex heuristics and Shannon entropy analysis. Migrate legacy codebases fast.",
    cmd: "qring scan .",
  },
  {
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </>
    ),
    title: "Governance Policy",
    desc: "Define MCP tool gating, key access restrictions, exec allowlists, and secret lifecycle rules in .q-ring.json.",
    cmd: "qring policy",
  },
  {
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    title: "User Approvals",
    desc: "Zero-trust MCP access. Sensitive secrets require HMAC-verified, scoped, time-limited approval tokens before reads.",
    cmd: 'qring approve PROD_DB_URL --for 3600',
  },
  {
    icon: (
      <>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </>
    ),
    title: "JIT Provisioning",
    desc: "Dynamically generate short-lived tokens on read. AWS STS role assumption, generic HTTP endpoints, and caching.",
    cmd: 'qring set AWS_KEYS \'...\' --jit-provider aws-sts',
  },
  {
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    title: "Agent Memory",
    desc: "Encrypted, persistent key-value store that survives across AI agent sessions. Remember decisions and context.",
    cmd: 'qring remember last_rotation "Rotated on 2026-03-21"',
  },
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
    title: "Secret Linter",
    desc: "Scan specific files for hardcoded secrets. Use --fix to auto-replace with process.env references and store in q-ring.",
    cmd: "qring lint src/config.ts --fix",
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
    title: "Team & Org Scopes",
    desc: "Share secrets across teams and orgs. Resolution cascades: project → team → org → global (most specific wins).",
    cmd: 'qring set SHARED_KEY "sk-..." --team my-team',
  },
  {
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    title: "Issuer-Native Rotation",
    desc: "Attempt provider-native secret rotation for supported services, or fall back to local quantum noise generation.",
    cmd: "qring rotate STRIPE_KEY",
  },
  {
    icon: (
      <>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </>
    ),
    title: "Secret Analytics",
    desc: "Analyze usage patterns: most accessed secrets, unused/stale keys, scope optimization, and rotation recommendations.",
    cmd: "qring analyze",
  },
];

export default function Features() {
  return (
    <section className="py-24 relative z-1" id="features">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Quantum Features
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            Twenty-four capabilities inspired by quantum physics, engineered for
            real-world secret management.
          </p>
        </FadeIn>
        <StaggerGroup className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              className="bg-bg-card border border-border rounded-md p-7 transition-[border-color,box-shadow] duration-300 hover:border-border-glow hover:shadow-[0_8px_32px_rgba(14,165,233,0.1)]"
            >
              <svg
                className="w-8 h-8 mb-3 drop-shadow-[0_0_6px_rgba(0,209,255,0.5)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#neon-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icon}
              </svg>
              <h3 className="text-[1.15rem] font-semibold mb-2 text-text-primary">
                {f.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {f.desc}
              </p>
              <code className="block font-[family-name:var(--font-mono)] text-xs text-accent bg-[rgba(14,165,233,0.08)] px-3 py-2 rounded-sm break-all">
                {f.cmd}
              </code>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
