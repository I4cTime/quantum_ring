"use client";

import NextLink from "next/link";
import { Card, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Carousel } from "@heroui-pro/react";
import { ArrowUpRight, type LucideIcon, MousePointerClick, Sparkles, Sprout, Terminal, Wind } from "lucide-react";

type Status = "native" | "mcp" | "compatible";

type Integration = {
  name: string;
  Icon: LucideIcon;
  tag: string;
  desc: string;
  status: Status;
  href: string;
  accent: string;
};

const STATUS_LABEL: Record<Status, string> = {
  native: "Native plugin",
  mcp: "MCP server",
  compatible: "Compatible",
};

const STATUS_COLOR: Record<Status, "success" | "accent" | "warning"> = {
  native: "success",
  mcp: "accent",
  compatible: "warning",
};

const INTEGRATIONS: Integration[] = [
  {
    name: "Cursor",
    Icon: MousePointerClick,
    tag: "First-class",
    desc: "Drop-in plugin with hooks, secrets MCP, and one-shot env injection.",
    status: "native",
    href: "/docs#cursor",
    accent: "from-cyan-400 to-sky-500",
  },
  {
    name: "Kiro",
    Icon: Sprout,
    tag: "Auto-discovered",
    desc: "MCP server is detected automatically — zero-config setup.",
    status: "mcp",
    href: "/docs#kiro",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    name: "Claude Code",
    Icon: Sparkles,
    tag: "MCP server",
    desc: "Add q-ring as an MCP server in claude_desktop_config.json.",
    status: "mcp",
    href: "/docs#claude-code",
    accent: "from-violet-400 to-fuchsia-500",
  },
  {
    name: "VS Code",
    Icon: Terminal,
    tag: "Cline / Continue",
    desc: "Use the q-ring CLI directly or wire up via Cline / Continue.dev.",
    status: "compatible",
    href: "/docs#vscode",
    accent: "from-sky-400 to-indigo-500",
  },
  {
    name: "Windsurf",
    Icon: Wind,
    tag: "MCP-compatible",
    desc: "Codeium Windsurf reads the same MCP server config as Claude.",
    status: "compatible",
    href: "/docs#windsurf",
    accent: "from-rose-400 to-orange-500",
  },
];

export default function IntegrationsCarousel() {
  return (
    <section className="py-20 relative z-1" id="integrations">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Works everywhere
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Drop into your AI editor of choice
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            MCP-native, hook-friendly, and CLI-first. q-ring slots into the
            agent toolchain you already use.
          </p>
        </div>

        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <Carousel.Content className="-ml-4">
            {INTEGRATIONS.map((integration) => (
              <Carousel.Item
                key={integration.name}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <IntegrationCard integration={integration} />
              </Carousel.Item>
            ))}
          </Carousel.Content>
          <div className="hidden md:block">
            <Carousel.Previous />
            <Carousel.Next />
          </div>
          <Carousel.Dots />
        </Carousel>
      </div>
    </section>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const { name, Icon, tag, desc, status, href, accent } = integration;
  return (
    <Card className="h-full bg-bg-card/70 border border-border/70 backdrop-blur transition-colors hover:border-border-glow">
      <div
        className={`h-1 w-full bg-gradient-to-r ${accent} rounded-t-[inherit]`}
        aria-hidden
      />
      <Card.Header className="pt-5 pb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center size-10 rounded-md bg-gradient-to-br ${accent} text-bg-deep`}
          >
            <Icon className="size-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="text-text-primary font-semibold text-base">
              {name}
            </span>
            <span className="text-text-dim text-xs uppercase tracking-widest">
              {tag}
            </span>
          </div>
        </div>
        <Chip size="sm" variant="soft" color={STATUS_COLOR[status]}>
          {STATUS_LABEL[status]}
        </Chip>
      </Card.Header>
      <Card.Content className="text-text-secondary text-sm leading-relaxed pt-0">
        {desc}
      </Card.Content>
      <Card.Footer className="pt-2 pb-5">
        <NextLink
          href={href}
          className={`${buttonVariants({ variant: "ghost", size: "sm" })} text-accent-bright`}
        >
          Setup guide
          <ArrowUpRight className="size-3.5" aria-hidden />
        </NextLink>
      </Card.Footer>
    </Card>
  );
}
