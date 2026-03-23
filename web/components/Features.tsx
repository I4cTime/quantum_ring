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
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <h2 className="section-title reveal">Quantum Features</h2>
        <p className="section-subtitle reveal">
          Thirteen mechanics inspired by quantum physics, engineered for
          real-world secret management.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={f.title} className="feature-card reveal" data-delay={i}>
              <svg
                className="feature-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#neon-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icon}
              </svg>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <code className="feature-cmd">{f.cmd}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
