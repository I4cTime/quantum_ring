"use client";

import { KPI, KPIGroup } from "@heroui-pro/react";
import { Code2, Layers, Plug, Sparkles } from "lucide-react";

const STATS = [
  {
    title: "MCP Tools",
    value: 44,
    Icon: Plug,
    status: "success" as const,
    trend: "up" as const,
    trendLabel: "+12 since v0.9",
  },
  {
    title: "Quantum Features",
    value: 24,
    Icon: Sparkles,
    status: "success" as const,
    trend: "up" as const,
    trendLabel: "+6 since v0.9",
  },
  {
    title: "CLI Commands",
    value: 9,
    Icon: Code2,
    status: "warning" as const,
    trend: "neutral" as const,
    trendLabel: "groups",
  },
  {
    title: "AI Editors",
    value: 5,
    Icon: Layers,
    status: "danger" as const,
    trend: "up" as const,
    trendLabel: "Cursor · Kiro · Claude · VSCode · Windsurf",
  },
];

export default function TrustStrip() {
  return (
    <section className="py-16 relative z-1" id="trust">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-8 space-y-2">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Trusted by AI-first builders
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
            Built for the agent era
          </h2>
        </div>

        <div className="rounded-2xl border border-border/60 bg-bg-card/40 backdrop-blur p-1">
          <KPIGroup className="bg-transparent">
            {STATS.map((stat, idx) => (
              <Stat key={stat.title} stat={stat} isLast={idx === STATS.length - 1} />
            ))}
          </KPIGroup>
        </div>
      </div>
    </section>
  );
}

function Stat({
  stat,
  isLast,
}: {
  stat: (typeof STATS)[number];
  isLast: boolean;
}) {
  const { title, value, Icon, status, trend, trendLabel } = stat;
  return (
    <>
      <KPI className="bg-transparent shadow-none">
        <KPI.Header>
          <KPI.Icon status={status}>
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </KPI.Icon>
          <KPI.Title className="text-text-secondary text-xs uppercase tracking-widest">
            {title}
          </KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value
            className="text-text-primary text-3xl md:text-4xl font-extrabold"
            locale="en-US"
            maximumFractionDigits={0}
            value={value}
          />
          <KPI.Trend trend={trend}>{trendLabel}</KPI.Trend>
        </KPI.Content>
      </KPI>
      {!isLast ? <KPIGroup.Separator /> : null}
    </>
  );
}
