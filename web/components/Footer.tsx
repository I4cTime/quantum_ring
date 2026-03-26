import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-bg-deep border-t border-border py-10 relative z-1">
      <div className="max-w-[1200px] mx-auto px-6 text-center flex flex-col items-center gap-4">
        <div className="font-[family-name:var(--font-display)] font-bold text-lg flex items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/icon.png"
            alt="q-ring icon"
            className="w-6 h-6 object-contain mix-blend-screen drop-shadow-[0_0_6px_var(--color-accent-glow)]"
            width={24}
            height={24}
          />{" "}
          q-ring
          <span className="text-xs text-text-dim font-normal ml-2">v0.9.6</span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/docs" className="text-text-secondary hover:text-accent transition-colors">
            Docs
          </Link>
          <Link href="/changelog" className="text-text-secondary hover:text-accent transition-colors">
            Changelog
          </Link>
          <a href="https://github.com/I4cTime/quantum_ring" target="_blank" rel="noopener" className="text-text-secondary hover:text-accent transition-colors">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/@i4ctime/q-ring" target="_blank" rel="noopener" className="text-text-secondary hover:text-accent transition-colors">
            npm
          </a>
          <a href="https://ko-fi.com/i4ctime" target="_blank" rel="noopener" className="text-text-secondary hover:text-accent transition-colors">
            Ko-fi
          </a>
          <a href="https://github.com/I4cTime/quantum_ring/blob/main/LICENSE" target="_blank" rel="noopener" className="text-text-secondary hover:text-accent transition-colors">
            AGPL-3.0
          </a>
        </div>
        <p className="text-text-dim text-xs">
          &copy; 2025&ndash;2026 I4cTime. Free to use, modify, and share under
          AGPL-3.0.
        </p>
      </div>
    </footer>
  );
}
