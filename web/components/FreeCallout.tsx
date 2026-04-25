import { Card, Chip } from "@heroui/react";
import { Cloud, Heart, ScrollText, ServerOff, Sparkles } from "lucide-react";

const POINTS = [
  {
    Icon: Sparkles,
    title: "Free forever",
    body: "Every feature, every command, every MCP tool — no paywall, no premium tier, no upsell.",
  },
  {
    Icon: ServerOff,
    title: "No telemetry",
    body: "q-ring never phones home. The only outbound traffic is the provider call you explicitly request.",
  },
  {
    Icon: Cloud,
    title: "Local-first",
    body: "Your secrets live in your OS keyring. The dashboard runs on 127.0.0.1. There is no cloud.",
  },
];

export default function FreeCallout() {
  return (
    <section className="py-20 relative z-1" id="free">
      <div className="max-w-[1100px] mx-auto px-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-bg-card via-bg-card to-bg-deep border border-border/70 backdrop-blur">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-accent-dim)_0%,transparent_55%)] pointer-events-none"
            aria-hidden
          />

          <Card.Header className="relative pt-8 px-6 md:px-12 flex flex-col items-center text-center gap-4">
            <Chip
              size="sm"
              variant="soft"
              color="accent"
              className="border border-border/70 backdrop-blur"
            >
              <ScrollText
                className="size-3.5 text-accent-bright"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-widest">
                AGPL-3.0 · MIT-spirit
              </span>
            </Chip>
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent leading-tight max-w-[680px]">
              Free, open, and yours — forever.
            </h2>
            <p className="text-text-secondary max-w-[640px] leading-relaxed">
              q-ring is licensed under AGPL-3.0. Use it on personal projects, in
              your startup, inside your enterprise — no asterisks. The only
              commitment we ask back: improvements stay open so the next builder
              benefits too.
            </p>
          </Card.Header>

          <Card.Content className="relative px-6 md:px-12 pb-10 pt-6">
            <div className="grid gap-5 md:grid-cols-3">
              {POINTS.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col gap-2 p-4 rounded-lg border border-border/60 bg-bg-deep/40 backdrop-blur"
                >
                  <div className="flex items-center gap-2 text-accent-bright">
                    <p.Icon
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="text-text-primary font-semibold text-sm">
                      {p.title}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-text-dim text-sm">
              <span>
                Want to support the work?
              </span>
              <a
                href="https://ko-fi.com/i4ctime"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-accent-bright hover:underline"
              >
                <Heart
                  className="size-3.5"
                  strokeWidth={1.75}
                  fill="currentColor"
                  aria-hidden
                />
                Buy me a coffee on Ko-fi
              </a>
              <span className="text-text-dim/60">·</span>
              <span className="text-text-dim text-xs">
                Optional. Always optional.
              </span>
            </div>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}
