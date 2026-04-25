"use client";

import { KPI, KPIGroup } from "@heroui-pro/react";
import {
  AlertTriangle,
  Bot,
  type LucideIcon,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import TerminalCard from "@/components/TerminalCard";

type AgentKpi = {
  title: string;
  Icon: LucideIcon;
  value: number;
  style?: "decimal" | "percent";
  status?: "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  trendLabel: string;
  desc: string;
};

const KPIS: AgentKpi[] = [
  {
    title: "Continuous Monitoring",
    Icon: ShieldCheck,
    value: 0.999,
    style: "percent",
    status: "success",
    trend: "up",
    trendLabel: "uptime, last 30d",
    desc: "Scans secret health at configurable intervals. Detects expiration, anomalies, and staleness in real time.",
  },
  {
    title: "Auto-Rotation",
    Icon: RefreshCw,
    value: 0,
    status: "success",
    trend: "neutral",
    trendLabel: "manual rotations needed",
    desc: "Regenerates expired secrets via providers or quantum noise. Zero downtime, zero pages.",
  },
  {
    title: "Anomaly Detection",
    Icon: AlertTriangle,
    value: 4,
    status: "warning",
    trend: "down",
    trendLabel: "burst alerts, last 7d",
    desc: "Tracks access patterns and flags burst access, unusual hours, and suspicious behavior.",
  },
];

export default function AgentMode() {
  return (
    <section className="py-24 relative z-1" id="agent">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Background daemon
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold inline-flex items-center gap-3 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            <Bot
              className="size-8 text-accent-bright -translate-y-1"
              strokeWidth={1.75}
              aria-hidden
            />
            Agent Mode
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            Autonomous background daemon that guards your secrets 24/7 — rotates,
            audits, and alerts so you don&apos;t have to.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-bg-card/40 backdrop-blur p-1 mb-10">
          <KPIGroup className="bg-transparent">
            {KPIS.map((kpi, idx) => (
              <AgentStat
                key={kpi.title}
                kpi={kpi}
                isLast={idx === KPIS.length - 1}
              />
            ))}
          </KPIGroup>
        </div>

        <div className="grid gap-3 md:grid-cols-3 mb-10">
          {KPIS.map((kpi) => (
            <p
              key={kpi.title}
              className="text-text-secondary text-sm leading-relaxed border-l-2 border-accent-dim/60 pl-3"
            >
              <strong className="text-text-primary">{kpi.title}.</strong>{" "}
              {kpi.desc}
            </p>
          ))}
        </div>

        <div className="max-w-[640px] mx-auto">
          <TerminalCard
            title="~/agent"
            copyText="qring agent --interval 60 --auto-rotate --verbose"
            maxWidth="640px"
          >
            <pre className="m-0 text-text-secondary text-sm">
              <span className="text-emerald-400 font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring agent</span>{" "}
              --interval 60 --auto-rotate --verbose
            </pre>
          </TerminalCard>
        </div>
      </div>
    </section>
  );
}

function AgentStat({ kpi, isLast }: { kpi: AgentKpi; isLast: boolean }) {
  return (
    <>
      <KPI className="bg-transparent shadow-none">
        <KPI.Header>
          <KPI.Icon status={kpi.status}>
            <kpi.Icon className="size-4" strokeWidth={2} aria-hidden />
          </KPI.Icon>
          <KPI.Title className="text-text-secondary text-xs uppercase tracking-widest">
            {kpi.title}
          </KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value
            className="text-text-primary text-3xl md:text-4xl font-extrabold"
            locale="en-US"
            style={kpi.style ?? "decimal"}
            maximumFractionDigits={kpi.style === "percent" ? 1 : 0}
            value={kpi.value}
          />
          {kpi.trend ? (
            <KPI.Trend trend={kpi.trend}>{kpi.trendLabel}</KPI.Trend>
          ) : null}
        </KPI.Content>
      </KPI>
      {!isLast ? <KPIGroup.Separator /> : null}
    </>
  );
}
