"use client";

import { useCallback } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button, Kbd } from "@heroui/react";
import { Navbar } from "@heroui-pro/react";
import { Search } from "lucide-react";

import { BrandGithub } from "@/components/icons/BrandIcons";
import { useCommandPalette } from "@/lib/command-palette-context";

const NAV_ITEMS = [
  { href: "/#features", label: "Features" },
  { href: "/#integrations", label: "Integrations" },
  { href: "/#why", label: "Why q-ring" },
  { href: "/#mcp", label: "MCP" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
] as const;

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openPalette } = useCommandPalette();

  const navigate = useCallback(
    (href: string) => {
      // Next.js App Router's router.push() to the current URL is a no-op:
      // it neither scrolls to a hash nor scrolls to top. Handle both cases
      // here so the navbar always feels responsive.
      const hashIndex = href.indexOf("#");
      if (hashIndex !== -1) {
        const targetPath = href.slice(0, hashIndex) || "/";
        const id = href.slice(hashIndex + 1);
        if (targetPath === pathname && id) {
          const el = document.getElementById(id);
          if (el) {
            window.history.replaceState(null, "", href);
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
        }
      } else if (href === pathname) {
        window.history.replaceState(null, "", href);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(href);
    },
    [pathname, router],
  );

  const handleBrandClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        event.preventDefault();
        navigate("/");
      }
    },
    [navigate, pathname],
  );

  return (
    <Navbar
      maxWidth="xl"
      navigate={navigate}
      position="sticky"
      shouldBlockScroll={false}
      className="bg-bg-deep/85 backdrop-blur-xl backdrop-saturate-[1.2] border-b border-border"
    >
      <Navbar.Header>
        <Navbar.MenuToggle className="md:hidden" />

        <Navbar.Brand>
          <NextLink
            href="/"
            onClick={handleBrandClick}
            className="font-[family-name:var(--font-display)] font-bold text-xl text-text-primary inline-flex items-center gap-2"
            aria-label="q-ring home"
          >
            <Image
              src="/assets/icon.png"
              alt=""
              aria-hidden
              width={24}
              height={24}
              className="object-contain mix-blend-screen drop-shadow-[0_0_6px_var(--color-accent-glow)]"
              priority
            />
            <span>q-ring</span>
          </NextLink>
        </Navbar.Brand>

        <Navbar.Content className="hidden md:flex">
          {NAV_ITEMS.map((item) => {
            const isCurrent = item.href.startsWith("/")
              ? pathname === item.href || pathname?.startsWith(`${item.href}/`)
              : false;
            return (
              <Navbar.Item
                key={item.href}
                href={item.href}
                isCurrent={isCurrent}
                className={
                  isCurrent
                    ? "!text-text-primary hover:!text-accent-bright text-sm font-semibold"
                    : "!text-text-secondary hover:!text-text-primary text-sm font-medium"
                }
              >
                {item.label}
              </Navbar.Item>
            );
          })}
        </Navbar.Content>

        <Navbar.Spacer />

        <Navbar.Content>
          <Button
            size="sm"
            variant="ghost"
            onPress={openPalette}
            aria-label="Open command palette"
            className="text-text-primary hidden gap-2 sm:inline-flex"
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden text-sm md:inline">Search</span>
            <Kbd className="hidden text-xs md:inline-flex">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </Button>

          <Navbar.Item
            href="https://github.com/I4cTime/quantum_ring"
            aria-label="q-ring on GitHub"
            className="!text-text-secondary hover:!text-text-primary"
          >
            <BrandGithub data-slot="icon" className="size-5" />
          </Navbar.Item>
        </Navbar.Content>
      </Navbar.Header>

      <Navbar.Menu>
        {NAV_ITEMS.map((item) => (
          <Navbar.MenuItem key={item.href} href={item.href}>
            {item.label}
          </Navbar.MenuItem>
        ))}
        <Navbar.MenuItem href="https://github.com/I4cTime/quantum_ring">
          GitHub
        </Navbar.MenuItem>
      </Navbar.Menu>
    </Navbar>
  );
}
