"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

export default function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !navRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;
    const focusable = menuRef.current.querySelectorAll<HTMLElement>("a, button");
    if (focusable.length) focusable[0].focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#quickstart", label: "Quick Start" },
    { href: "/#dashboard", label: "Dashboard" },
    { href: "/#mcp", label: "MCP" },
    { href: "/#architecture", label: "Architecture" },
    { href: "/docs", label: "Docs" },
    { href: "/changelog", label: "Changelog" },
  ];

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-100 backdrop-blur-xl backdrop-saturate-[1.2] border-b border-border transition-[background,box-shadow] duration-300 ${
        scrolled
          ? "bg-bg-deep/[0.92] shadow-[0_2px_32px_rgba(14,165,233,0.08)]"
          : "bg-bg-deep/75"
      }`}
      id="nav"
      ref={navRef}
      aria-label="Main navigation"
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
        <a
          href="/quantum_ring/"
          className="font-[family-name:var(--font-display)] font-bold text-xl text-text-primary flex items-center gap-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/quantum_ring/assets/icon.png"
            alt="q-ring icon"
            className="w-6 h-6 object-contain mix-blend-screen drop-shadow-[0_0_6px_var(--color-accent-glow)]"
            width={24}
            height={24}
          />{" "}
          q-ring
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex gap-6 text-sm font-medium">
          {navLinks.map((l) =>
            l.href.startsWith("/") && !l.href.startsWith("/#") ? (
              <Link
                key={l.label}
                href={l.href}
                className="text-text-secondary hover:text-accent-bright transition-colors"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.href.startsWith("/#") ? `/quantum_ring${l.href.slice(1)}` : l.href}
                className="text-text-secondary hover:text-accent-bright transition-colors"
              >
                {l.label}
              </a>
            )
          )}
          <a
            href="https://github.com/I4cTime/quantum_ring"
            target="_blank"
            rel="noopener"
            className="text-text-secondary hover:text-accent-bright transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 group"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-transform duration-300 ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-opacity duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-transform duration-300 ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu panel */}
      <div
        ref={menuRef}
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 bg-bg-deep/95 backdrop-blur-xl border-t border-border ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col px-6 py-4 gap-3 text-base font-medium">
          {navLinks.map((l) =>
            l.href.startsWith("/") && !l.href.startsWith("/#") ? (
              <Link
                key={l.label}
                href={l.href}
                className="text-text-secondary hover:text-accent-bright py-1 transition-colors"
                onClick={closeMenu}
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.href.startsWith("/#") ? `/quantum_ring${l.href.slice(1)}` : l.href}
                className="text-text-secondary hover:text-accent-bright py-1 transition-colors"
                onClick={closeMenu}
              >
                {l.label}
              </a>
            )
          )}
          <a
            href="https://github.com/I4cTime/quantum_ring"
            target="_blank"
            rel="noopener"
            className="text-text-secondary hover:text-accent-bright py-1 transition-colors"
            onClick={closeMenu}
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
