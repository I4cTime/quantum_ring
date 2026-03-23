import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/motion/FadeIn";
import CopyableTerminal from "@/components/CopyableTerminal";
import Link from "next/link";

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
];

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-24 pb-16 relative z-1">
        <div className="max-w-[800px] mx-auto px-6">
          <FadeIn>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-accent mb-8 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to home
            </Link>
          </FadeIn>

          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
              Getting Started
            </h1>
            <p className="text-text-secondary text-lg mb-12 leading-relaxed">
              Three steps to quantum-secured secrets: install, store, and
              integrate.
            </p>
          </FadeIn>

          {/* Step 1: Install */}
          <FadeIn delay={0.1}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </span>
                Install q-ring
              </h2>
              <p className="text-text-secondary mb-6">
                Pick your package manager and install globally:
              </p>
              <div className="space-y-3">
                {installCmds.map((i) => (
                  <CopyableTerminal key={i.pm} title={i.pm} maxWidth="100%">
                    <pre>
                      <span className="text-green font-bold">$</span>{" "}
                      <span className="text-accent-bright font-medium">{i.cmd}</span>
                    </pre>
                  </CopyableTerminal>
                ))}
              </div>
            </section>
          </FadeIn>

          {/* Step 2: First secret */}
          <FadeIn delay={0.2}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </span>
                Store your first secret
              </h2>
              <p className="text-text-secondary mb-6">
                Secrets are stored in your OS-native keyring (macOS Keychain,
                Windows Credential Vault, or Linux Secret Service):
              </p>
              <CopyableTerminal title="~ / terminal" maxWidth="100%">
                <pre>
                  <span className="text-[#555]"># Store a secret</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring set</span> OPENAI_API_KEY sk-proj-abc123...
                  {"\n\n"}
                  <span className="text-[#555]"># Retrieve it</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring get</span> OPENAI_API_KEY
                  {"\n"}
                  sk-proj-abc123...
                  {"\n\n"}
                  <span className="text-[#555]"># List all stored keys</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring list</span>
                  {"\n"}
                  OPENAI_API_KEY  [dev]  healthy  0 reads
                  {"\n\n"}
                  <span className="text-[#555]"># Run a health check</span>
                  {"\n"}
                  <span className="text-green font-bold">$</span>{" "}
                  <span className="text-accent-bright font-medium">qring health</span>
                </pre>
              </CopyableTerminal>
            </section>
          </FadeIn>

          {/* Step 3: MCP config */}
          <FadeIn delay={0.3}>
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </span>
                Configure MCP
              </h2>
              <p className="text-text-secondary mb-6">
                Add q-ring as an MCP server so AI agents can manage secrets
                natively. Just add one entry to your config:
              </p>

              <h3 className="text-lg font-semibold mb-3 text-text-primary">
                Cursor / Kiro
              </h3>
              <div className="mb-6">
                <CopyableTerminal title=".cursor/mcp.json" maxWidth="100%">
                  <pre>
                    {`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                  </pre>
                </CopyableTerminal>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-text-primary">
                Claude Code
              </h3>
              <CopyableTerminal title="claude_desktop_config.json" maxWidth="100%">
                <pre>
                  {`{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`}
                </pre>
              </CopyableTerminal>
            </section>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="border-t border-border pt-8 text-center">
              <p className="text-text-secondary mb-4">
                Ready to explore more features?
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/#features"
                  className="px-6 py-2.5 bg-accent/10 text-accent border border-accent/30 rounded-md text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                  Explore Features
                </Link>
                <Link
                  href="/changelog"
                  className="px-6 py-2.5 bg-bg-card text-text-secondary border border-border rounded-md text-sm font-medium hover:border-border-glow transition-colors"
                >
                  View Changelog
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
