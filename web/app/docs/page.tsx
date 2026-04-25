import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Card, Chip } from "@heroui/react";
import {
  BookOpen,
  ChevronLeft,
  Database,
  Plug,
  ScrollText,
  Server,
  TerminalSquare,
  Wand2,
  Zap,
} from "lucide-react";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/motion/FadeIn";
import TerminalCard from "@/components/TerminalCard";
import CliReferenceList from "@/components/docs/CliReferenceList";
import DocsToc, { type TocItem } from "@/components/docs/DocsToc";
import PromptCard from "@/components/docs/PromptCard";
import {
  CLI_REFERENCE_COUNT,
  MCP_PROMPTS,
} from "@/lib/data/cli-reference";

export const metadata: Metadata = {
  title: "Getting Started — q-ring",
  description:
    "Install q-ring, store your first secret, and configure MCP for Cursor, Kiro, or Claude Code.",
};

const installCmds = [
  { pm: "pnpm", cmd: "pnpm add -g @i4ctime/q-ring" },
  { pm: "npm", cmd: "npm install -g @i4ctime/q-ring" },
  { pm: "yarn", cmd: "yarn global add @i4ctime/q-ring" },
  { pm: "bun", cmd: "bun add -g @i4ctime/q-ring" },
  { pm: "brew", cmd: "brew install i4ctime/tap/qring" },
];

const TOC: TocItem[] = [
  { id: "quickstart", label: "Quick start", level: 1 },
  { id: "install", label: "Install", level: 2 },
  { id: "first-secret", label: "First secret", level: 2 },
  { id: "mcp", label: "Configure MCP", level: 2 },
  { id: "cursor-plugin", label: "Cursor plugin", level: 2 },
  { id: "cli-reference", label: "CLI reference", level: 1 },
  { id: "mcp-cookbook", label: "MCP cookbook", level: 1 },
];

const PLUGIN_PREVIEW = [
  {
    title: "3 Rules",
    desc: "Always-on guidance for secret hygiene, q-ring workflow, and .env safety.",
  },
  {
    title: "5 Skills",
    desc: "Auto-triggered: management, scanning, rotation, exec, onboarding.",
  },
  {
    title: "2 Agents",
    desc: "Security auditor and day-to-day secret-ops assistant.",
  },
  {
    title: "8 Commands",
    desc: "Slash commands for scan, rotate, validate, exec, teleport, and more.",
  },
  {
    title: "2 Hooks",
    desc: "After-file-edit scan and session-start project context.",
  },
  {
    title: "MCP Connector",
    desc: "Auto-connects to qring-mcp — all 44 tools available.",
  },
];

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-24 pb-16 relative z-1">
        <div className="max-w-[840px] mx-auto px-6">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
              <Breadcrumbs className="text-sm text-text-dim">
                <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                <Breadcrumbs.Item>Docs</Breadcrumbs.Item>
              </Breadcrumbs>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-accent transition-colors"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Back to home
              </Link>
            </div>
          </FadeIn>

          <FadeIn>
            <header className="mb-12 space-y-4">
              <Chip
                size="sm"
                variant="soft"
                color="accent"
                className="border border-border/70 bg-bg-card/60 backdrop-blur"
              >
                <BookOpen
                  className="size-3.5 text-accent-bright"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-widest">
                  Documentation
                </span>
              </Chip>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
                Getting Started
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-[640px]">
                Three steps to quantum-secured secrets: install, store, and
                integrate. Then dive into the {CLI_REFERENCE_COUNT}-command CLI
                reference and the MCP cookbook.
              </p>
            </header>
          </FadeIn>

          <FadeIn delay={0.1}>
            <section id="quickstart" className="scroll-mt-24 space-y-10 mb-20">
              <SectionHeader
                Icon={Zap}
                eyebrow="Step 1 → 4"
                title="Quick start"
                desc="From npm install to MCP-wired editor in under three minutes."
              />

              <div id="install" className="scroll-mt-24 space-y-4">
                <SubHeading number={1} title="Install q-ring" />
                <p className="text-text-secondary">
                  Pick your package manager and install globally:
                </p>
                <div className="space-y-3">
                  {installCmds.map((i) => (
                    <TerminalCard
                      key={i.pm}
                      title={i.pm}
                      copyText={i.cmd}
                      maxWidth="100%"
                    >
                      <pre className="m-0">
                        <span className="text-emerald-400 font-bold">$</span>{" "}
                        <span className="text-accent-bright font-medium">
                          {i.cmd}
                        </span>
                      </pre>
                    </TerminalCard>
                  ))}
                </div>
              </div>

              <div id="first-secret" className="scroll-mt-24 space-y-4">
                <SubHeading number={2} title="Store your first secret" />
                <p className="text-text-secondary">
                  Secrets are stored in your OS-native keyring (macOS Keychain,
                  Windows Credential Vault, or Linux Secret Service):
                </p>
                <TerminalCard
                  title="~ / terminal"
                  copyText={[
                    "qring set OPENAI_API_KEY sk-proj-abc123...",
                    "qring get OPENAI_API_KEY",
                    "qring list",
                    "qring health",
                  ].join("\n")}
                  maxWidth="100%"
                >
                  <pre className="m-0">
                    <span className="text-text-dim"># Store a secret</span>
                    {"\n"}
                    <span className="text-emerald-400 font-bold">$</span>{" "}
                    <span className="text-accent-bright font-medium">
                      qring set
                    </span>{" "}
                    OPENAI_API_KEY sk-proj-abc123...
                    {"\n\n"}
                    <span className="text-text-dim"># Retrieve it</span>
                    {"\n"}
                    <span className="text-emerald-400 font-bold">$</span>{" "}
                    <span className="text-accent-bright font-medium">
                      qring get
                    </span>{" "}
                    OPENAI_API_KEY
                    {"\n"}
                    <span className="text-text-secondary">
                      sk-proj-abc123...
                    </span>
                    {"\n\n"}
                    <span className="text-text-dim"># List all stored keys</span>
                    {"\n"}
                    <span className="text-emerald-400 font-bold">$</span>{" "}
                    <span className="text-accent-bright font-medium">
                      qring list
                    </span>
                    {"\n"}
                    <span className="text-text-secondary">
                      OPENAI_API_KEY [dev] healthy 0 reads
                    </span>
                    {"\n\n"}
                    <span className="text-text-dim"># Run a health check</span>
                    {"\n"}
                    <span className="text-emerald-400 font-bold">$</span>{" "}
                    <span className="text-accent-bright font-medium">
                      qring health
                    </span>
                  </pre>
                </TerminalCard>
              </div>

              <div id="mcp" className="scroll-mt-24 space-y-4">
                <SubHeading number={3} title="Configure MCP" />
                <p className="text-text-secondary">
                  Add q-ring as an MCP server so AI agents can manage secrets
                  natively. Same single binary, every host.
                </p>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm text-text-primary font-semibold inline-flex items-center gap-2">
                      <Plug
                        className="size-4 text-accent-bright"
                        aria-hidden
                      />
                      Cursor / Kiro
                    </h4>
                    <TerminalCard
                      title=".cursor/mcp.json"
                      copyText={`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                      maxWidth="100%"
                    >
                      <pre className="m-0 text-text-secondary text-sm">{`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}</pre>
                    </TerminalCard>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm text-text-primary font-semibold inline-flex items-center gap-2">
                      <Plug
                        className="size-4 text-accent-bright"
                        aria-hidden
                      />
                      Claude Code
                    </h4>
                    <TerminalCard
                      title="claude_desktop_config.json"
                      copyText={`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                      maxWidth="100%"
                    >
                      <pre className="m-0 text-text-secondary text-sm">{`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}</pre>
                    </TerminalCard>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm text-text-primary font-semibold inline-flex items-center gap-2">
                      <Plug
                        className="size-4 text-accent-bright"
                        aria-hidden
                      />
                      VS Code
                    </h4>
                    <TerminalCard
                      title=".vscode/mcp.json"
                      copyText={`{
  "servers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                      maxWidth="100%"
                    >
                      <pre className="m-0 text-text-secondary text-sm">{`{
  "servers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}</pre>
                    </TerminalCard>
                  </div>
                </div>
              </div>

              <div id="cursor-plugin" className="scroll-mt-24 space-y-4">
                <SubHeading number={4} title="Cursor Plugin (optional)" />
                <p className="text-text-secondary">
                  The{" "}
                  <strong className="text-text-primary">
                    q-ring Cursor Plugin
                  </strong>{" "}
                  bundles rules, skills, agents, slash commands, hooks, and the
                  MCP connector — pre-wired to the 44 tools.
                </p>

                <Card className="bg-bg-card/60 border border-border/70">
                  <Card.Content className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {PLUGIN_PREVIEW.map((p) => (
                        <div key={p.title} className="space-y-1">
                          <p className="text-accent-bright font-semibold inline-flex items-center gap-2">
                            <Wand2 className="size-3.5" aria-hidden />
                            {p.title}
                          </p>
                          <p className="text-text-secondary leading-relaxed">
                            {p.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>

                <TerminalCard
                  title="manual install"
                  copyText="cp -r cursor-plugin/ ~/.cursor/plugins/qring/"
                  maxWidth="100%"
                >
                  <pre className="m-0">
                    <span className="text-text-dim">
                      # Install from Cursor marketplace, or manually:
                    </span>
                    {"\n"}
                    <span className="text-emerald-400 font-bold">$</span>{" "}
                    <span className="text-accent-bright font-medium">
                      cp -r cursor-plugin/ ~/.cursor/plugins/qring/
                    </span>
                  </pre>
                </TerminalCard>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={0.2}>
            <section
              id="cli-reference"
              className="scroll-mt-24 mb-20 border-t border-border/60 pt-12"
            >
              <SectionHeader
                Icon={TerminalSquare}
                eyebrow="Reference"
                title="CLI complete reference"
                desc={`Every CLI command and option is listed below with at least one real invocation example. ${CLI_REFERENCE_COUNT} commands in total.`}
              />
              <div className="mt-8">
                <CliReferenceList />
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={0.3}>
            <section
              id="mcp-cookbook"
              className="scroll-mt-24 mb-20 border-t border-border/60 pt-12"
            >
              <SectionHeader
                Icon={Server}
                eyebrow="MCP cookbook"
                title="Prompt cookbook"
                desc="Every MCP tool with a one-sentence prompt example you can paste into any agent chat."
              />
              <div className="mt-8 space-y-3">
                {MCP_PROMPTS.map(([tool, prompt]) => (
                  <PromptCard key={tool} tool={tool} prompt={prompt} />
                ))}
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="border-t border-border pt-10 text-center space-y-4">
              <p className="text-text-secondary inline-flex items-center gap-2 justify-center">
                <Database
                  className="size-4 text-accent-bright"
                  aria-hidden
                />
                Ready to explore more features?
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href="/#features"
                  className="px-6 py-2.5 bg-accent/10 text-accent-bright border border-accent/30 rounded-md text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                  Explore features
                </Link>
                <Link
                  href="/changelog"
                  className="px-6 py-2.5 bg-bg-card text-text-secondary border border-border rounded-md text-sm font-medium hover:border-border-glow transition-colors inline-flex items-center gap-1.5"
                >
                  <ScrollText className="size-3.5" aria-hidden />
                  View changelog
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="pointer-events-none fixed inset-y-0 right-4 z-30 hidden items-center lg:flex">
          <div className="pointer-events-auto">
            <DocsToc items={TOC} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SectionHeader({
  Icon,
  eyebrow,
  title,
  desc,
}: {
  Icon: React.ElementType;
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-text-dim text-xs uppercase tracking-widest inline-flex items-center gap-2">
        <Icon className="size-3.5 text-accent-bright" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold text-text-primary">{title}</h2>
      <p className="text-text-secondary leading-relaxed max-w-[640px]">
        {desc}
      </p>
    </div>
  );
}

function SubHeading({ number, title }: { number: number; title: string }) {
  return (
    <h3 className="text-xl font-semibold text-text-primary flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-accent/15 text-accent-bright flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </span>
      {title}
    </h3>
  );
}
