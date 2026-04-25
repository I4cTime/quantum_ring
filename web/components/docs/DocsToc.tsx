"use client";

import { useCallback, useEffect, useState } from "react";
import { FloatingToc } from "@heroui-pro/react";

export type TocItem = {
  id: string;
  label: string;
  level?: number;
};

type Props = {
  items: TocItem[];
};

export default function DocsToc({ items }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  const computeActive = useCallback(() => {
    if (typeof window === "undefined") return;
    // Anchor sits comfortably below the sticky navbar (~96px). A section
    // becomes active as soon as its heading scrolls under this point.
    const anchor = 280;
    let candidate = items[0]?.id ?? "";
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top - anchor <= 0) {
        candidate = item.id;
      } else {
        break;
      }
    }
    setActiveId(candidate);
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    computeActive();
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        computeActive();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [computeActive]);

  const onJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <FloatingToc placement="right" triggerMode="hover">
      <FloatingToc.Trigger aria-label="Table of contents">
        {items.map((item) => (
          <FloatingToc.Bar
            key={item.id}
            active={item.id === activeId}
            level={item.level ?? 1}
          />
        ))}
      </FloatingToc.Trigger>
      <FloatingToc.Content className="!bg-bg-deep border border-border/70">
        <span className="text-text-dim mb-1 block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
          On this page
        </span>
        {items.map((item) => (
          <FloatingToc.Item
            key={item.id}
            active={item.id === activeId}
            level={item.level ?? 1}
            onClick={() => onJump(item.id)}
          >
            {item.label}
          </FloatingToc.Item>
        ))}
      </FloatingToc.Content>
    </FloatingToc>
  );
}
