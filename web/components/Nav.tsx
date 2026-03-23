"use client";

import { useEffect, useRef } from "react";

export default function Nav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        navRef.current?.classList.toggle("scrolled", window.scrollY > 60);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="nav" id="nav" ref={navRef}>
      <div className="nav-inner">
        <a href="#" className="nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/quantum_ring/assets/icon.png"
            alt="q-ring icon"
            className="nav-icon"
            width={24}
            height={24}
          />{" "}
          q-ring
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#quickstart">Quick Start</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#mcp">MCP</a>
          <a href="#architecture">Architecture</a>
          <a
            href="https://github.com/I4cTime/quantum_ring"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
