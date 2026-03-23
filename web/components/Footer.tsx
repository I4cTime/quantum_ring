export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/quantum_ring/assets/icon.png"
            alt="q-ring icon"
            className="nav-icon"
            width={24}
            height={24}
          />{" "}
          q-ring
          <span className="footer-version">v0.4.0</span>
        </div>
        <div className="footer-links">
          <a
            href="https://github.com/I4cTime/quantum_ring"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@i4ctime/q-ring"
            target="_blank"
            rel="noopener"
          >
            npm
          </a>
          <a
            href="https://ko-fi.com/i4cdeath"
            target="_blank"
            rel="noopener"
          >
            Ko-fi
          </a>
          <a
            href="https://github.com/I4cTime/quantum_ring/blob/main/LICENSE"
            target="_blank"
            rel="noopener"
          >
            AGPL-3.0
          </a>
        </div>
        <p className="footer-copy">
          &copy; 2025–2026 I4cTime. Free to use, modify, and share under
          AGPL-3.0.
        </p>
      </div>
    </footer>
  );
}
