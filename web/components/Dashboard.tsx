const dashFeatures = [
  {
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    title: "Live SSE Updates",
    desc: "Data streams every 5 seconds via Server-Sent Events. No polling, no WebSocket complexity.",
  },
  {
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
    title: "Eight Panels",
    desc: "Health, environment, decay timers, superposition, entanglement, tunnels, anomalies, and audit log.",
  },
  {
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    title: "Fully Local",
    desc: "Self-contained HTML served on localhost. No dependencies, no cloud, no data leaves your machine.",
  },
];

export default function Dashboard() {
  return (
    <section className="section section-alt" id="dashboard">
      <div className="container">
        <h2 className="section-title reveal">Status Dashboard</h2>
        <p className="section-subtitle reveal">
          Real-time visibility into every quantum subsystem. One command, zero
          config.
        </p>

        <div className="dash-showcase reveal">
          <div className="dash-preview">
            <div className="dash-browser-frame">
              <div className="dash-browser-bar">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="dash-browser-url">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  127.0.0.1:9876
                </span>
                <span className="dash-live-dot" />
              </div>
              <div className="dash-mock-grid">
                <div className="dash-mock-card">
                  <div className="dash-mock-title">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="url(#neon-grad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Health Summary
                  </div>
                  <div className="dash-mock-donut">
                    <svg viewBox="0 0 100 100" width="64" height="64">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="10"
                        strokeDasharray="180 59"
                        strokeLinecap="round"
                        opacity="0.8"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="var(--warning)"
                        strokeWidth="10"
                        strokeDasharray="30 209"
                        strokeDashoffset="-180"
                        strokeLinecap="round"
                        opacity="0.8"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="dash-mock-donut-label">12</div>
                  </div>
                </div>
                <div className="dash-mock-card">
                  <div className="dash-mock-title">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="url(#neon-grad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Environment
                  </div>
                  <span className="dash-mock-env">prod</span>
                </div>
                <div className="dash-mock-card">
                  <div className="dash-mock-title">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="url(#neon-grad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 22h14" />
                      <path d="M5 2h14" />
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                    </svg>
                    Decay Timers
                  </div>
                  <div className="dash-mock-bars">
                    <div className="dash-mock-bar">
                      <span style={{ width: "35%", background: "var(--accent)" }} />
                    </div>
                    <div className="dash-mock-bar">
                      <span style={{ width: "72%", background: "var(--warning)" }} />
                    </div>
                    <div className="dash-mock-bar">
                      <span style={{ width: "91%", background: "var(--danger)" }} />
                    </div>
                  </div>
                </div>
                <div className="dash-mock-card">
                  <div className="dash-mock-title">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="url(#neon-grad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Entanglement
                  </div>
                  <div className="dash-mock-pairs">
                    <span>
                      API_KEY <span className="dash-arrow">&harr;</span>{" "}
                      API_BACKUP
                    </span>
                    <span>
                      DB_PASS <span className="dash-arrow">&harr;</span>{" "}
                      DB_REPLICA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-features">
            {dashFeatures.map((f) => (
              <div key={f.title} className="dash-feature-item reveal">
                <svg
                  className="dash-feat-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#neon-grad)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {f.icon}
                </svg>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="terminal terminal-dash reveal">
          <div className="terminal-bar">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="terminal-title">~ / terminal</span>
          </div>
          <div className="terminal-body">
            <pre>
              <span className="t-comment">
                # Launch the dashboard (auto-opens your browser)
              </span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring status</span>
              {"\n\n"}
              <span className="t-comment"># Custom port</span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring status</span> --port 4200
              {"\n\n"}
              <span className="t-comment">
                # Don&apos;t auto-open the browser
              </span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring status</span> --no-open
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
