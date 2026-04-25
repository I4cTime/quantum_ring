"use client";

import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { Button, toast } from "@heroui/react";
import { Check, Copy } from "lucide-react";

type TerminalCardProps = {
  title: string;
  children: ReactNode;
  copyText?: string;
  className?: string;
  maxWidth?: string;
};

function defaultExtractText(node: HTMLElement) {
  return node.innerText
    .replace(/^\$\s*/gm, "")
    .replace(/^#.*$/gm, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

export default function TerminalCard({ title, children, copyText, className, maxWidth }: TerminalCardProps) {
  const [copied, setCopied] = useState(false);
  const reactId = useId();
  const contentId = `terminal-${reactId.replace(/[:]/g, "")}`;

  const onCopy = useCallback(async () => {
    const value =
      copyText ??
      (() => {
        const el = document.getElementById(contentId);
        if (!el) return "";
        return defaultExtractText(el);
      })();

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied.", { description: value });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.danger("Copy failed.", { description: "Clipboard permission denied." });
    }
  }, [contentId, copyText]);

  const icon = useMemo(
    () => (copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />),
    [copied],
  );

  return (
    <div
      className={
        className ??
        "bg-[#0c0c0c] border border-border rounded-2xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.4)] mx-auto"
      }
      style={maxWidth ? { maxWidth } : undefined}
    >
      <div className="flex flex-row items-center gap-2 px-4 h-10 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57] shrink-0" aria-hidden />
        <span className="w-3 h-3 rounded-full bg-[#febc2e] shrink-0" aria-hidden />
        <span className="w-3 h-3 rounded-full bg-[#28c840] shrink-0" aria-hidden />
        <span className="ml-2 text-[#888] text-xs font-[family-name:var(--font-mono)] flex-1 truncate text-center">
          {title}
        </span>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="text-[#888] hover:text-text-primary"
          onPress={onCopy}
          aria-label={copied ? "Copied" : "Copy terminal content"}
        >
          {icon}
        </Button>
      </div>
      <div
        id={contentId}
        className="px-6 py-5 font-[family-name:var(--font-mono)] text-sm leading-[1.8] overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
}

