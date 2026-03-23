"use client";

import type { ReactNode } from "react";
import FadeIn from "@/components/motion/FadeIn";
import CopyableTerminal from "@/components/CopyableTerminal";

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
    <section className="py-24 relative z-1 bg-bg-alt" id="dashboard">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Status Dashboard
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            Real-time visibility into every quantum subsystem. One command, zero
            config.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-[1.2fr_1fr] gap-10 items-start mb-10 max-md:grid-cols-1">
            {/* Browser mock */}
            <div className="bg-bg-deep border border-[rgba(14,165,233,0.15)] rounded-md overflow-hidden shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6),0_0_24px_rgba(14,165,233,0.06)]">
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-bg-deep/80 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-2 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] text-text-dim bg-white/[0.04] px-2.5 py-0.5 rounded flex-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  127.0.0.1:9876
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--color-green)] animate-dash-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                <DashCard title="Health Summary" icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}>
                  <div className="flex items-center gap-3 relative">
                    <svg viewBox="0 0 100 100" width="64" height="64">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeDasharray="180 59" strokeLinecap="round" opacity="0.8" transform="rotate(-90 50 50)" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-warning)" strokeWidth="10" strokeDasharray="30 209" strokeDashoffset="-180" strokeLinecap="round" opacity="0.8" transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold font-[family-name:var(--font-display)] text-text-primary">12</div>
                  </div>
                </DashCard>
                <DashCard title="Environment" icon={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />}>
                  <span className="inline-block text-xs font-bold font-[family-name:var(--font-mono)] px-3 py-0.5 rounded-sm bg-[rgba(255,0,85,0.2)] text-[#ff0055] border border-[rgba(255,0,85,0.3)]">
                    prod
                  </span>
                </DashCard>
                <DashCard
                  title="Decay Timers"
                  icon={
                    <>
                      <path d="M5 22h14" />
                      <path d="M5 2h14" />
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                    </>
                  }
                >
                  <div className="flex flex-col gap-1.5">
                    {[
                      { w: "35%", c: "var(--color-accent)" },
                      { w: "72%", c: "var(--color-warning)" },
                      { w: "91%", c: "var(--color-danger)" },
                    ].map((b, i) => (
                      <div key={i} className="h-[5px] rounded-sm bg-white/[0.06] overflow-hidden">
                        <span className="block h-full rounded-sm" style={{ width: b.w, background: b.c }} />
                      </div>
                    ))}
                  </div>
                </DashCard>
                <DashCard
                  title="Entanglement"
                  icon={
                    <>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </>
                  }
                >
                  <div className="flex flex-col gap-1 font-[family-name:var(--font-mono)] text-[0.65rem] text-text-secondary">
                    <span>API_KEY <span className="text-accent-bright mx-1">&harr;</span> API_BACKUP</span>
                    <span>DB_PASS <span className="text-accent-bright mx-1">&harr;</span> DB_REPLICA</span>
                  </div>
                </DashCard>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-6">
              {dashFeatures.map((f) => (
                <div key={f.title} className="flex gap-4 items-start">
                  <svg
                    className="w-8 h-8 shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(0,209,255,0.5)]"
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
                    <h4 className="text-[0.95rem] font-semibold mb-1">{f.title}</h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <CopyableTerminal title="~ / terminal" maxWidth="600px">
            <pre>
              <span className="text-[#555]">
                # Launch the dashboard (auto-opens your browser)
              </span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring status</span>
              {"\n\n"}
              <span className="text-[#555]"># Custom port</span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring status</span> --port 4200
              {"\n\n"}
              <span className="text-[#555]">
                # Don&apos;t auto-open the browser
              </span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring status</span> --no-open
            </pre>
          </CopyableTerminal>
        </FadeIn>
      </div>
    </section>
  );
}

function DashCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-[rgba(15,26,46,0.85)] backdrop-blur-xl border border-[rgba(14,165,233,0.2)] rounded-sm p-3 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-wide text-text-dim font-semibold mb-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
        {title}
      </div>
      {children}
    </div>
  );
}
