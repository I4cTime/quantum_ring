"use client";

import { useEffect, useState } from "react";
import { Chip, Kbd } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ArrowRight, Keyboard, Search, Sparkles, Terminal } from "lucide-react";

import { useCommandPalette } from "@/lib/command-palette-context";
import { CLI_COMMAND_COUNT } from "@/lib/data/cli-commands";
import { MCP_TOOL_COUNT } from "@/lib/data/mcp-tools";

const TERMINAL_LINES = [
  { kind: "prompt", text: "qring set OPENAI_API_KEY sk-... --project --env dev" },
  { kind: "ok", text: "✓ Stored OPENAI_API_KEY in project keyring" },
  { kind: "prompt", text: "qring exec --project -- node app.js" },
  { kind: "info", text: "→ injecting 4 secrets · output redacted" },
  { kind: "ok", text: "✓ app.js exited cleanly" },
  { kind: "prompt", text: "qring validate --all --manifest --project" },
  { kind: "info", text: "→ checking 12 secrets against providers" },
  { kind: "ok", text: "✓ 11 valid · 1 expired (STRIPE_KEY)" },
  { kind: "prompt", text: "qring rotate STRIPE_KEY --provider stripe" },
  { kind: "ok", text: "✓ STRIPE_KEY rotated · downstream entanglements updated" },
] as const;

export default function LiveDemo() {
  const { openPalette } = useCommandPalette();
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= TERMINAL_LINES.length) return;
    const id = window.setTimeout(() => {
      setVisible((v) => v + 1);
    }, visible === 0 ? 300 : 600);
    return () => window.clearTimeout(id);
  }, [visible]);

  useEffect(() => {
    if (visible < TERMINAL_LINES.length) return;
    const id = window.setTimeout(() => setVisible(0), 4500);
    return () => window.clearTimeout(id);
  }, [visible]);

  return (
    <section className="py-24 relative z-1" id="live-demo">
      <div className="max-w-[1200px] mx-auto px-6 grid gap-10 lg:grid-cols-2 items-center">
        <div className="flex flex-col gap-5">
          <Chip
            size="sm"
            variant="soft"
            className="self-start border border-border/70 bg-bg-card/60 text-text-secondary backdrop-blur"
          >
            <Sparkles className="size-3.5 text-accent-bright" aria-hidden />
            <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-widest">
              Try it in your browser
            </span>
          </Chip>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            One palette,{" "}
            <span className="bg-gradient-to-br from-accent to-accent-bright bg-clip-text text-transparent">
              every command
            </span>
            .
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Press{" "}
            <Kbd className="text-xs">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>{" "}
            anywhere on this site to fuzzy-search every page, MCP tool, and CLI
            command. Hit <Kbd className="text-xs"><Kbd.Content>Enter</Kbd.Content></Kbd> to copy,
            navigate, or open docs.
          </p>

          <ul className="grid gap-3 text-sm text-text-secondary">
            <li className="flex items-start gap-3">
              <Search className="size-4 mt-0.5 text-accent-bright shrink-0" aria-hidden />
              <span>
                <strong className="text-text-primary">{MCP_TOOL_COUNT} MCP tools</strong>{" "}
                grouped by capability — pick one to copy its tool name into your
                editor.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Terminal className="size-4 mt-0.5 text-accent-bright shrink-0" aria-hidden />
              <span>
                <strong className="text-text-primary">{CLI_COMMAND_COUNT} CLI examples</strong>{" "}
                across {`${"9 groups"}`} — from{" "}
                <code>qring set</code> to <code>qring teleport pack</code>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Keyboard className="size-4 mt-0.5 text-accent-bright shrink-0" aria-hidden />
              <span>
                <strong className="text-text-primary">Keyboard-first</strong> —
                arrow keys to navigate, Enter to act, Esc to close.
              </span>
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              type="button"
              onClick={openPalette}
              className={`${buttonVariants({ variant: "primary", size: "lg" })} font-semibold`}
            >
              <Search className="size-4" aria-hidden />
              Open command palette
              <Kbd className="text-xs ml-1">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>K</Kbd.Content>
              </Kbd>
            </button>

            <a
              href="#mcp"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} font-semibold`}
            >
              Browse all MCP tools
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-[#0c0c0c] shadow-[0_24px_72px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden />
            <span className="size-3 rounded-full bg-[#febc2e]" aria-hidden />
            <span className="size-3 rounded-full bg-[#28c840]" aria-hidden />
            <span className="text-text-dim ml-3 font-[family-name:var(--font-mono)] text-xs">
              ~/quantum_ring · live preview
            </span>
          </div>
          <div className="min-h-[360px] p-5 font-[family-name:var(--font-mono)] text-sm leading-relaxed">
            {TERMINAL_LINES.slice(0, visible).map((line, idx) => (
              <Line key={idx} kind={line.kind} text={line.text} />
            ))}
            {visible < TERMINAL_LINES.length ? (
              <span className="bg-accent-bright inline-block h-4 w-2 animate-pulse align-middle" />
            ) : (
              <div className="text-text-dim mt-4 text-xs">
                ── replaying in 4s ──
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Line({ kind, text }: { kind: string; text: string }) {
  if (kind === "prompt") {
    return (
      <div>
        <span className="text-text-dim">$ </span>
        <span className="text-accent-bright">{text}</span>
      </div>
    );
  }
  if (kind === "ok") {
    return <div className="text-emerald-400">{text}</div>;
  }
  return <div className="text-text-dim">{text}</div>;
}
