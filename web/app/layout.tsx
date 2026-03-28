import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://qring.i4c.studio"),
  title: "q-ring — Quantum Keyring for AI Agents",
  description:
    "The first quantum-inspired keyring built specifically for AI coding agents. Secure secrets with superposition, entanglement, tunneling, and teleportation.",
  icons: {
    icon: [
      { url: "/assets/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/assets/icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "q-ring — Quantum Keyring for AI Agents",
    description:
      "Stop pasting API keys into .env files. q-ring anchors credentials to your OS vault with quantum-inspired mechanics.",
    images: ["/assets/social-card-optimized.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-accent focus:text-bg-deep focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold focus:outline-none"
        >
          Skip to content
        </a>
        <SvgGradientDefs />
        {children}
      </body>
    </html>
  );
}

function SvgGradientDefs() {
  return (
    <svg
      style={{ width: 0, height: 0, position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D1FF" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
