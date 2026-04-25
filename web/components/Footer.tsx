import Image from "next/image";
import NextLink from "next/link";
import { Link } from "@heroui/react";
import { ExternalLink, Heart, Package, ScrollText } from "lucide-react";

import { BrandGithub } from "@/components/icons/BrandIcons";
import { PROJECT_VERSION } from "@/lib/data/version";

const PRODUCT_LINKS = [
  { href: "/docs", label: "Docs", external: false },
  { href: "/changelog", label: "Changelog", external: false },
  { href: "/#features", label: "Features", external: false },
  { href: "/#mcp", label: "MCP integrations", external: false },
] as const;

const COMMUNITY_LINKS = [
  {
    href: "https://github.com/I4cTime/quantum_ring",
    label: "GitHub",
    Icon: BrandGithub,
  },
  {
    href: "https://www.npmjs.com/package/@i4ctime/q-ring",
    label: "npm",
    Icon: Package,
  },
  {
    href: "https://ko-fi.com/i4ctime",
    label: "Ko-fi",
    Icon: Heart,
  },
  {
    href: "https://github.com/I4cTime/quantum_ring/blob/main/LICENSE",
    label: "AGPL-3.0",
    Icon: ScrollText,
  },
] as const;

export default function Footer() {
  return (
    <footer className="bg-bg-deep border-t border-border py-14 relative z-1">
      <div className="max-w-[1200px] mx-auto px-6 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="font-[family-name:var(--font-display)] font-bold text-lg flex items-center gap-2">
            <Image
              src="/assets/icon.png"
              alt=""
              aria-hidden
              width={24}
              height={24}
              className="object-contain mix-blend-screen drop-shadow-[0_0_6px_var(--color-accent-glow)]"
            />
            <span>q-ring</span>
            <span className="text-xs text-text-dim font-normal ml-1">
              v{PROJECT_VERSION}
            </span>
          </div>
          <p className="text-text-dim text-sm leading-relaxed max-w-[40ch]">
            Quantum-inspired keyring built for AI coding agents. Free forever
            under AGPL-3.0.
          </p>
        </div>

        <nav aria-label="Product" className="flex flex-col gap-3">
          <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-widest">
            Product
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {PRODUCT_LINKS.map((item) => (
              <li key={item.href}>
                <NextLink
                  href={item.href}
                  className="link text-text-secondary hover:text-accent-bright no-underline"
                >
                  {item.label}
                </NextLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Community" className="flex flex-col gap-3">
          <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-widest">
            Community
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {COMMUNITY_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener"
                  className="text-text-secondary hover:text-accent-bright no-underline inline-flex items-center gap-2"
                >
                  <Icon className="size-4" aria-hidden strokeWidth={1.75} />
                  {label}
                  <Link.Icon className="size-3 opacity-70">
                    <ExternalLink />
                  </Link.Icon>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 mt-10 pt-6 border-t border-border/60 flex flex-col md:flex-row justify-between gap-3 text-text-dim text-xs">
        <p>
          &copy; 2025&ndash;2026 I4cTime. Free to use, modify, and share under
          AGPL-3.0.
        </p>
        <p>
          Built with{" "}
          <Link
            href="https://nextjs.org"
            target="_blank"
            rel="noopener"
            className="text-text-dim hover:text-accent-bright no-underline"
          >
            Next.js
          </Link>
          ,{" "}
          <Link
            href="https://heroui.com"
            target="_blank"
            rel="noopener"
            className="text-text-dim hover:text-accent-bright no-underline"
          >
            HeroUI
          </Link>
          , and{" "}
          <Link
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener"
            className="text-text-dim hover:text-accent-bright no-underline"
          >
            Tailwind CSS
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
