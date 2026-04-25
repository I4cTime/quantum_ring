"use client";

import { KPI } from "@heroui-pro/react";
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

        {/*
          KPIGroup forces flex-1 equal columns which clips long labels at narrow
          widths. Use a custom grid that stacks 2x2 on small screens and flips
          to 1x4 on lg+ instead, with manual divider borders.
        */}
        <div className="rounded-2xl border border-border/60 bg-bg-card/40 backdrop-blur overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-y-0 divide-border/60 sm:[&>:nth-child(odd)]:border-r sm:[&>:nth-child(odd)]:border-border/60 sm:[&>:nth-child(-n+2)]:border-b sm:[&>:nth-child(-n+2)]:border-border/60 lg:[&>:not(:last-child)]:border-r lg:[&>*]:border-b-0">
            {STATS.map((stat) => (
              <Stat key={stat.title} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ stat }: { stat: (typeof STATS)[number] }) {
  const { title, value, Icon, status, trend, trendLabel } = stat;
  return (
    <KPI className="bg-transparent shadow-none rounded-none">
      <KPI.Header>
        <KPI.Icon status={status}>
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </KPI.Icon>
        <KPI.Title className="text-text-secondary text-[0.7rem] uppercase tracking-widest leading-tight">
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
        <KPI.Trend trend={trend} className="text-[0.7rem] text-right">
          {trendLabel}
        </KPI.Trend>
      </KPI.Content>
    </KPI>
  );
}
