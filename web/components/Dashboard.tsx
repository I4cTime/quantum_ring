"use client";

import type { ReactNode } from "react";
import {
  Activity,
  Hourglass,
  Link2,
  Lock,
  type LucideIcon,
  Shield,
  ShieldOff,
} from "lucide-react";
import { Chip } from "@heroui/react";
import {
  ChartTooltip,
  EmptyState,
  LineChart,
  RadialChart,
} from "@heroui-pro/react";

import TerminalCard from "@/components/TerminalCard";

const HEALTH_DATA = [
  { fill: "var(--color-accent-bright)", name: "Healthy", value: 12 },
];
const HEALTH_TOTAL = 14;

const ACCESS_DATA = [
  { hour: "00", reads: 12 },
  { hour: "02", reads: 8 },
  { hour: "04", reads: 5 },
  { hour: "06", reads: 14 },
  { hour: "08", reads: 28 },
  { hour: "10", reads: 41 },
  { hour: "12", reads: 36 },
  { hour: "14", reads: 47 },
  { hour: "16", reads: 38 },
  { hour: "18", reads: 22 },
  { hour: "20", reads: 16 },
  { hour: "22", reads: 11 },
];

const FEATURES = [
  {
    Icon: Activity,
    title: "Live SSE updates",
    desc: "Snapshots stream every 5s. Search input, sort order, and scroll position survive each tick — no lost typing.",
  },
  {
    Icon: Shield,
    title: "KPI strip + 13 panels",
    desc: "Headline KPIs, then health, env, manifest, policy, secrets table, decay, superposition, entanglement, tunnels, approvals, hooks, agent memory, anomalies, and a filterable audit feed.",
  },
  {
    Icon: Lock,
    title: "Fully local, never values",
    desc: "Self-contained HTML on 127.0.0.1. No dependencies, no cloud — and the page never renders secret values, only metadata.",
  },
];

export default function Dashboard() {
  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="dashboard">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Operator surface
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Status Dashboard
          </h2>
          <p className="text-text-secondary max-w-[680px] mx-auto">
            Headline KPIs, secrets table, manifest gaps, policy posture,
            approvals, hooks, anomalies, and a filterable 24h audit feed —
            streaming live from <code>127.0.0.1</code> with{" "}
            <code>qring status</code>.
          </p>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-10 items-start mb-10 max-md:grid-cols-1">
          <div className="bg-bg-deep border border-[rgba(14,165,233,0.18)] rounded-md overflow-hidden shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6),0_0_24px_rgba(14,165,233,0.06)]">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-bg-deep/80 border-b border-border">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" aria-hidden />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" aria-hidden />
              <span className="ml-2 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] text-text-dim bg-white/[0.04] px-2.5 py-0.5 rounded flex-1">
                <Lock className="size-3" aria-hidden />
                127.0.0.1:9876
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_var(--color-accent-bright)] animate-dash-pulse"
                aria-hidden
              />
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              <DashCard title="Health Summary" Icon={Shield}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <RadialChart
                      barSize={8}
                      data={HEALTH_DATA}
                      endAngle={-45}
                      height={86}
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={225}
                      width={86}
                    >
                      <RadialChart.AngleAxis
                        angleAxisId={0}
                        domain={[0, HEALTH_TOTAL]}
                        tick={false}
                        type="number"
                      />
                      <RadialChart.Bar
                        background
                        angleAxisId={0}
                        cornerRadius={6}
                        dataKey="value"
                      />
                      <RadialChart.Tooltip content={<HealthTooltip />} />
                    </RadialChart>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-text-primary text-base font-bold leading-none">
                        12
                      </span>
                      <span className="text-text-dim text-[9px] uppercase tracking-wide">
                        of {HEALTH_TOTAL}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span className="size-2 rounded-full bg-accent-bright" />
                      12 healthy
                    </span>
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span className="size-2 rounded-full bg-warning" />2 stale
                    </span>
                    <span className="flex items-center gap-1.5 text-text-dim">
                      <span className="size-2 rounded-full bg-text-dim/40" />0
                      expired
                    </span>
                  </div>
                </div>
              </DashCard>

              <DashCard title="Environment" Icon={Activity}>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="soft" color="danger">
                    prod
                  </Chip>
                  <span className="text-text-dim text-[10px]">
                    auto-detected · git/main
                  </span>
                </div>
              </DashCard>

              <DashCard
                title="Access (24h)"
                Icon={Activity}
                className="col-span-2"
              >
                <div className="-ml-1">
                  <LineChart data={ACCESS_DATA} height={80}>
                    <LineChart.Grid vertical={false} strokeOpacity={0.15} />
                    <LineChart.XAxis
                      dataKey="hour"
                      tick={{ fontSize: 9, fill: "var(--color-text-dim)" }}
                      tickMargin={2}
                    />
                    <LineChart.YAxis hide />
                    <LineChart.Line
                      dataKey="reads"
                      dot={false}
                      name="Reads"
                      stroke="var(--color-accent-bright)"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <LineChart.Tooltip
                      content={
                        <LineChart.TooltipContent
                          valueFormatter={(v) => `${Number(v)} reads`}
                        />
                      }
                    />
                  </LineChart>
                </div>
              </DashCard>

              <DashCard title="Decay Timers" Icon={Hourglass}>
                <div className="flex flex-col gap-1.5">
                  {[
                    { w: "35%", c: "var(--color-accent)", label: "API_KEY" },
                    { w: "72%", c: "var(--color-warning)", label: "DB_PASS" },
                    {
                      w: "91%",
                      c: "var(--color-danger)",
                      label: "STRIPE_KEY",
                    },
                  ].map((b) => (
                    <div
                      key={b.label}
                      className="flex items-center gap-2 text-[10px] text-text-secondary"
                    >
                      <span className="font-[family-name:var(--font-mono)] w-[72px] truncate">
                        {b.label}
                      </span>
                      <div className="flex-1 h-[5px] rounded-sm bg-white/[0.06] overflow-hidden">
                        <span
                          className="block h-full rounded-sm"
                          style={{ width: b.w, background: b.c }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </DashCard>

              <DashCard title="Entanglement" Icon={Link2}>
                <div className="flex flex-col gap-1 font-[family-name:var(--font-mono)] text-[0.65rem] text-text-secondary">
                  <span>
                    API_KEY
                    <span className="text-accent-bright mx-1">↔</span>
                    API_BACKUP
                  </span>
                  <span>
                    DB_PASS
                    <span className="text-accent-bright mx-1">↔</span>
                    DB_REPLICA
                  </span>
                </div>
              </DashCard>

              <DashCard title="Anomalies" Icon={ShieldOff} className="col-span-2">
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <Shield className="size-4 text-accent-bright" />
                    </EmptyState.Media>
                    <EmptyState.Title className="text-text-primary text-sm">
                      All clear
                    </EmptyState.Title>
                    <EmptyState.Description className="text-text-dim text-xs">
                      No suspicious access in the last 7 days.
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              </DashCard>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 items-start">
                <f.Icon
                  className="w-8 h-8 shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(0,209,255,0.5)] text-accent-bright"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <div>
                  <h4 className="text-[0.95rem] font-semibold mb-1 text-text-primary">
                    {f.title}
                  </h4>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[640px] mx-auto">
          <TerminalCard
            title="~/terminal"
            copyText="qring status"
            maxWidth="640px"
          >
            <pre className="m-0 text-text-secondary text-sm">
              <span className="text-text-dim">
                # Launch the dashboard (auto-opens your browser)
              </span>
              {"\n"}
              <span className="text-emerald-400 font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">
                qring status
              </span>
              {"\n\n"}
              <span className="text-text-dim"># Custom port</span>
              {"\n"}
              <span className="text-emerald-400 font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">
                qring status
              </span>{" "}
              --port 4200
              {"\n\n"}
              <span className="text-text-dim">
                # Don&apos;t auto-open the browser
              </span>
              {"\n"}
              <span className="text-emerald-400 font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">
                qring status
              </span>{" "}
              --no-open
            </pre>
          </TerminalCard>
        </div>
      </div>
    </section>
  );
}

function DashCard({
  title,
  Icon,
  children,
  className = "",
}: {
  title: string;
  Icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[rgba(15,26,46,0.85)] backdrop-blur-xl border border-[rgba(14,165,233,0.2)] rounded-sm p-3 shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${className}`}
    >
      <div className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-wide text-text-dim font-semibold mb-2.5">
        <Icon className="size-3.5 text-accent-bright" strokeWidth={2} aria-hidden />
        {title}
      </div>
      {children}
    </div>
  );
}

function HealthTooltip({
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    payload?: Record<string, unknown>;
    value?: number | string;
  }>;
}) {
  const entry = payload?.[0];
  if (!entry?.payload) return null;
  const name = (entry.payload["name"] as string) ?? entry.name;
  const value = (entry.payload["value"] as number) ?? entry.value;
  const fill = entry.payload["fill"] as string;
  return (
    <ChartTooltip>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color={fill} />
        <ChartTooltip.Label>{name}</ChartTooltip.Label>
        <ChartTooltip.Value>{value}</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  );
}
