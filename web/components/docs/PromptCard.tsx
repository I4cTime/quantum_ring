"use client";

import { useCallback, useState } from "react";
import { Button, toast } from "@heroui/react";
import { Check, Copy } from "lucide-react";

type Props = {
  tool: string;
  prompt: string;
};

export default function PromptCard({ tool, prompt }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copied.", { description: tool });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.danger("Copy failed.", {
        description: "Clipboard permission denied.",
      });
    }
  }, [prompt, tool]);

  return (
    <div className="bg-bg-card/70 border-border/60 hover:border-border-glow/60 group flex flex-col gap-2 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-start sm:gap-4">
      <code className="text-accent-bright bg-accent-dim shrink-0 self-start rounded px-2 py-1 font-[family-name:var(--font-mono)] text-xs">
        {tool}
      </code>
      <p className="text-text-secondary flex-1 text-sm leading-relaxed">
        {prompt}
      </p>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        onPress={onCopy}
        aria-label={copied ? "Copied" : `Copy prompt for ${tool}`}
        className="text-text-dim hover:!text-accent-bright shrink-0 self-end opacity-60 transition-opacity group-hover:opacity-100 sm:self-start"
      >
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}
