"use client";

import { useMemo, useState, type Key } from "react";
import { Button, Chip, Tabs, toast } from "@heroui/react";
import {
  ItemCard,
  ItemCardGroup,
  PressableFeedback,
  Sheet,
} from "@heroui-pro/react";
import { ChevronRight, Copy } from "lucide-react";

import {
  CATEGORY_LABELS,
  FEATURES,
  type Feature,
  type FeatureCategory,
} from "@/lib/data/features";

type Filter = "all" | FeatureCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "quantum", label: CATEGORY_LABELS.quantum },
  { id: "storage", label: CATEGORY_LABELS.storage },
  { id: "security", label: CATEGORY_LABELS.security },
  { id: "agent", label: CATEGORY_LABELS.agent },
];

const CATEGORY_COLOR: Record<
  FeatureCategory,
  "accent" | "default" | "warning" | "success"
> = {
  quantum: "accent",
  storage: "default",
  security: "warning",
  agent: "success",
};

export default function Features() {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? FEATURES : FEATURES.filter((f) => f.category === filter)),
    [filter],
  );

  const active = useMemo(
    () => (activeId ? FEATURES.find((f) => f.id === activeId) ?? null : null),
    [activeId],
  );

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.", { description: text });
    } catch {
      toast.danger("Copy failed.", {
        description: "Clipboard permission denied.",
      });
    }
  };

  return (
    <section className="py-24 relative z-1" id="features">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            What ships in q-ring
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Quantum Features
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            Twenty-three capabilities inspired by quantum physics — engineered for
            real-world secret management. Click any feature to peek at how it works.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs
            aria-label="Feature category"
            selectedKey={filter}
            onSelectionChange={(key: Key) => setFilter(key as Filter)}
            variant="secondary"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Filter">
                {FILTERS.map((f) => (
                  <Tabs.Tab key={f.id} id={f.id} className="!w-auto">
                    {f.label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        <ItemCardGroup
          layout="grid"
          columns={2}
          variant="transparent"
          className="gap-3"
        >
          {visible.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onOpen={() => setActiveId(feature.id)}
            />
          ))}
        </ItemCardGroup>
      </div>

      <Sheet
        placement="right"
        isOpen={active !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveId(null);
        }}
      >
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="w-full max-w-[460px]">
            <Sheet.Dialog className="h-full bg-bg-card border-l border-border">
              <Sheet.CloseTrigger />
              {active ? (
                <>
                  <Sheet.Header className="border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-md bg-accent/15 text-accent-bright">
                        <active.Icon className="size-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div className="flex flex-col text-left">
                        <Sheet.Heading className="text-lg font-semibold text-text-primary">
                          {active.title}
                        </Sheet.Heading>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={CATEGORY_COLOR[active.category]}
                          className="mt-1 self-start"
                        >
                          {CATEGORY_LABELS[active.category]}
                        </Chip>
                      </div>
                    </div>
                  </Sheet.Header>
                  <Sheet.Body className="space-y-5">
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {active.desc}
                    </p>
                    {active.long.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-text-secondary text-sm leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}

                    <div className="space-y-2">
                      <p className="text-text-dim text-xs uppercase tracking-widest">
                        Try it
                      </p>
                      <div className="flex items-start gap-2 rounded-md border border-border bg-[rgba(14,165,233,0.06)] px-3 py-2">
                        <pre className="m-0 flex-1 font-[family-name:var(--font-mono)] text-xs text-accent-bright break-all whitespace-pre-wrap">
                          {active.cmd}
                        </pre>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => onCopy(active.cmd)}
                          aria-label={`Copy command for ${active.title}`}
                        >
                          <Copy className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>

                    {active.related && active.related.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-text-dim text-xs uppercase tracking-widest">
                          Pairs well with
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {active.related.map((label) => (
                            <Chip
                              key={label}
                              size="sm"
                              variant="soft"
                              color="default"
                            >
                              {label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </Sheet.Body>
                  <Sheet.Footer className="border-t border-border/60">
                    <Sheet.Close>
                      <Button variant="ghost">Close</Button>
                    </Sheet.Close>
                    <a
                      href="/docs#commands"
                      className="ml-auto text-accent-bright text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Read the docs
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

function FeatureCard({
  feature,
  onOpen,
}: {
  feature: Feature;
  onOpen: () => void;
}) {
  return (
    <ItemCard<"button">
      className="relative w-full cursor-pointer overflow-hidden bg-bg-card/70 border border-border/60 hover:border-border-glow transition-colors text-left"
      render={(props) => <button type="button" {...props} onClick={onOpen} />}
    >
      <PressableFeedback.Highlight />
      <ItemCard.Icon className="text-accent-bright">
        <feature.Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </ItemCard.Icon>
      <ItemCard.Content>
        <ItemCard.Title className="text-text-primary">
          {feature.title}
        </ItemCard.Title>
        <ItemCard.Description className="text-text-secondary line-clamp-2">
          {feature.desc}
        </ItemCard.Description>
      </ItemCard.Content>
      <ItemCard.Action>
        <ChevronRight className="size-4 text-text-dim" aria-hidden />
      </ItemCard.Action>
    </ItemCard>
  );
}
