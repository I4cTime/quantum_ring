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
    <section className="section" id="agent">
      <div className="container">
        <h2 className="section-title reveal">Agent Mode</h2>
        <p className="section-subtitle reveal">
          Autonomous background daemon that guards your secrets 24/7.
        </p>
        <div className="agent-grid">
          {agents.map((a) => (
            <div key={a.title} className="agent-card reveal">
              <svg
                className="agent-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#neon-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {a.icon}
              </svg>
              <h4>{a.title}</h4>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
        <div className="terminal terminal-agent reveal">
          <div className="terminal-bar">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="terminal-title">~ / agent</span>
          </div>
          <div className="terminal-body">
            <pre>
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring agent</span> --interval 60
              --auto-rotate --verbose
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
