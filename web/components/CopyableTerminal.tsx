"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";

interface CopyableTerminalProps {
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function CopyableTerminal({
  title,
  children,
  maxWidth = "750px",
}: CopyableTerminalProps) {
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    if (!bodyRef.current) return;
    const text = bodyRef.current.innerText
      .replace(/^\$\s*/gm, "")
      .replace(/^#.*$/gm, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may fail in insecure contexts */
    }
  }, []);

  return (
    <div
      className="bg-[#0c0c0c] border border-border rounded-md overflow-hidden mx-auto shadow-[0_12px_48px_rgba(0,0,0,0.4)]"
      style={{ maxWidth }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[#666] text-xs font-[family-name:var(--font-mono)] flex-1">
          {title}
        </span>
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded transition-colors duration-200 ${
            copied
              ? "text-green"
              : "text-text-dim hover:text-accent hover:bg-accent-dim"
          }`}
          aria-label="Copy terminal content"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <div
        ref={bodyRef}
        className="px-6 py-5 font-[family-name:var(--font-mono)] text-sm leading-[1.8] overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
}
