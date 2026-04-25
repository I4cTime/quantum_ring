import { Accordion } from "@heroui/react";
import {
  Bot,
  Box,
  ChevronDown,
  Cloud,
  HeartHandshake,
  KeyRound,
  RefreshCw,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    Icon: ShieldCheck,
    title: "Where are my secrets actually stored?",
    body: "Your OS keyring (macOS Keychain, Windows Credential Manager, libsecret on Linux) via @napi-rs/keyring. q-ring never touches plaintext disk and never round-trips your secrets to a server.",
  },
  {
    Icon: Cloud,
    title: "Is there a SaaS or cloud component?",
    body: "No. q-ring is 100% local. The optional dashboard runs on 127.0.0.1, the MCP server runs on stdio, and the CLI never makes outbound calls except when you explicitly run validate/rotate/JIT operations against your own providers.",
  },
  {
    Icon: Bot,
    title: "How does it integrate with AI editors?",
    body: "Two ways. The Cursor plugin auto-loads rules, skills, agents, slash commands, and hooks. Every other editor (Kiro, Claude Code, VS Code, Windsurf) gets the same 44 tools by adding a single MCP server config — same binary, no extra wiring.",
  },
  {
    Icon: KeyRound,
    title: "Can multiple environments share one key name?",
    body: "Yes — that's the whole point of Superposition. One key like API_KEY can carry distinct values for dev, staging, and prod. Wavefunction Collapse picks the right one based on flags, env vars, git branch, and your project manifest.",
  },
  {
    Icon: RefreshCw,
    title: "What happens when a secret expires?",
    body: "Decay-aware reads will refuse expired secrets and warn on stale ones. Pair with the Agent for autonomous rotation, or run `qring rotate` to issue a provider-native rotation (with a quantum-noise fallback when the provider has no rotation API).",
  },
  {
    Icon: Box,
    title: "How do I migrate from .env files?",
    body: "Run `qring import .env --skip-existing`. Comments, quoting, and escape sequences are preserved. Then delete the .env file and use `qring exec`, `qring env:generate`, or the MCP `get_secret` tool from your code.",
  },
  {
    Icon: Bot,
    title: "Is this safe for AI agents to operate?",
    body: "Yes. Every tool call is gated by your governance policy, sensitive secrets require HMAC approvals, and every read/write/delete is logged in a tamper-evident audit chain. Agents never see plaintext unless your policy allows it.",
  },
  {
    Icon: HeartHandshake,
    title: "What's the license? Is there a paid tier?",
    body: "AGPL-3.0, free forever. There is no paid tier, no telemetry, and no upsell. If you want to support the work, the Ko-fi link in the header is appreciated — but it never unlocks anything.",
  },
];

export default function Faq() {
  return (
    <section className="py-24 relative z-1" id="faq">
      <div className="max-w-[820px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Common questions
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Frequently asked
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            Everything you might want to know before adopting q-ring. If something
            isn&apos;t covered here, open an issue on GitHub — we update this list
            regularly.
          </p>
        </div>

        <Accordion
          variant="surface"
          className="w-full bg-bg-card/50 backdrop-blur border border-border/70 rounded-xl overflow-hidden"
        >
          {FAQ_ITEMS.map((item) => (
            <Accordion.Item key={item.title}>
              <Accordion.Heading>
                <Accordion.Trigger className="text-left">
                  <span className="mr-3 inline-flex items-center justify-center size-7 rounded-md bg-accent/15 text-accent-bright shrink-0">
                    <item.Icon
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <span className="font-semibold text-text-primary">
                    {item.title}
                  </span>
                  <Accordion.Indicator>
                    <ChevronDown className="size-4 text-text-dim" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="text-text-secondary leading-relaxed">
                  {item.body}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>

        <p className="text-text-dim text-xs text-center mt-6 inline-flex items-center gap-1.5 justify-center w-full">
          <ScrollText className="size-3.5" aria-hidden />
          Still curious? <a
            href="https://github.com/I4cTime/quantum_ring/issues/new"
            target="_blank"
            rel="noopener"
            className="text-accent-bright hover:underline"
          >Open a question</a> and we&apos;ll add it.
        </p>
      </div>
    </section>
  );
}
