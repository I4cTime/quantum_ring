"use client";

import { useMemo, useState } from "react";
import { Button, Chip } from "@heroui/react";
import {
  ItemCard,
  ItemCardGroup,
  PressableFeedback,
  Sheet,
} from "@heroui-pro/react";
import { ChevronRight } from "lucide-react";

import TerminalCard from "@/components/TerminalCard";
import { PLUGIN_CATEGORIES } from "@/lib/data/plugin";

export default function CursorPlugin() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () =>
      activeId ? PLUGIN_CATEGORIES.find((c) => c.id === activeId) ?? null : null,
    [activeId],
  );

  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="cursor-plugin">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Drop into Cursor
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Cursor Plugin
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            Quantum secret management built into your IDE. Rules, skills, agents,
            commands, hooks, and the MCP connector — pre-wired to q-ring&apos;s
            44 tools. Click any card for details.
          </p>
        </div>

        <ItemCardGroup
          layout="grid"
          columns={3}
          variant="transparent"
          className="gap-3"
        >
          {PLUGIN_CATEGORIES.map((cat) => (
            <ItemCard<"button">
              key={cat.id}
              className="relative w-full cursor-pointer overflow-hidden bg-bg-card/70 border border-border/60 hover:border-border-glow transition-colors text-left"
              render={(props) => (
                <button
                  type="button"
                  {...props}
                  onClick={() => setActiveId(cat.id)}
                />
              )}
            >
              <PressableFeedback.Highlight />
              <ItemCard.Icon className="text-accent-bright">
                <cat.Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title className="text-text-primary flex items-center gap-2">
                  {cat.title}
                  <Chip size="sm" variant="soft" color="default">
                    {cat.count}
                  </Chip>
                </ItemCard.Title>
                <ItemCard.Description className="text-text-secondary line-clamp-2">
                  {cat.summary}
                </ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <ChevronRight className="size-4 text-text-dim" aria-hidden />
              </ItemCard.Action>
            </ItemCard>
          ))}
        </ItemCardGroup>

        <div className="mt-12 max-w-[640px] mx-auto">
          <TerminalCard title="~/install" copyText="cp -r cursor-plugin/ ~/.cursor/plugins/qring/" maxWidth="640px">
            <pre className="m-0 text-text-secondary text-sm">
              <span className="text-text-dim">
                # Install from the Cursor marketplace, or manually:
              </span>
              {"\n"}
              <span className="text-emerald-400 font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">
                cp -r cursor-plugin/ ~/.cursor/plugins/qring/
              </span>
            </pre>
          </TerminalCard>
        </div>
      </div>

      <Sheet
        placement="right"
        isOpen={active !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveId(null);
        }}
      >
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="w-full max-w-[480px]">
            <Sheet.Dialog className="h-full bg-bg-card border-l border-border">
              <Sheet.CloseTrigger />
              {active ? (
                <>
                  <Sheet.Header className="border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-md bg-accent/15 text-accent-bright">
                        <active.Icon
                          className="size-5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <Sheet.Heading className="text-lg font-semibold text-text-primary">
                          {active.title}
                        </Sheet.Heading>
                        <span className="text-text-dim text-xs">
                          {active.count}{" "}
                          {active.count === 1 ? "asset" : "assets"} ship with the
                          plugin
                        </span>
                      </div>
                    </div>
                  </Sheet.Header>
                  <Sheet.Body className="space-y-5">
                    {active.description.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-text-secondary text-sm leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}

                    <div className="space-y-2">
                      <p className="text-text-dim text-xs uppercase tracking-widest">
                        Included
                      </p>
                      <ul className="flex flex-col gap-2">
                        {active.assets.map((asset) => (
                          <li
                            key={asset.name}
                            className="flex flex-col gap-1 rounded-md border border-border/70 bg-bg-deep/50 px-3 py-2"
                          >
                            <code className="font-[family-name:var(--font-mono)] text-xs text-accent-bright">
                              {asset.name}
                            </code>
                            <span className="text-text-secondary text-sm leading-relaxed">
                              {asset.desc}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Sheet.Body>
                  <Sheet.Footer className="border-t border-border/60">
                    <Sheet.Close>
                      <Button variant="ghost">Close</Button>
                    </Sheet.Close>
                    <a
                      href="https://github.com/I4cTime/quantum_ring/tree/main/cursor-plugin"
                      target="_blank"
                      rel="noopener"
                      className="ml-auto text-accent-bright text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Browse source
                      <ChevronRight className="size-3.5" aria-hidden />
                    </a>
                  </Sheet.Footer>
                </>
              ) : null}
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </section>
  );
}
