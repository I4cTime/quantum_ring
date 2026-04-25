import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Chip } from "@heroui/react";
import { ChevronLeft, ScrollText } from "lucide-react";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/motion/FadeIn";
import ChangelogList from "@/components/changelog/ChangelogList";
import { CHANGELOG, CHANGELOG_RELEASE_COUNT } from "@/lib/data/changelog";

export const metadata: Metadata = {
  title: "Changelog — q-ring",
  description: "Version history and release notes for q-ring.",
};

export default function ChangelogPage() {
  const latest = CHANGELOG[0];
  return (
    <>
      <Nav />
      <main id="main" className="pt-24 pb-16 relative z-1">
        <div className="max-w-[860px] mx-auto px-6">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
              <Breadcrumbs className="text-sm text-text-dim">
                <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                <Breadcrumbs.Item>Changelog</Breadcrumbs.Item>
              </Breadcrumbs>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-accent transition-colors"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Back to home
              </Link>
            </div>
          </FadeIn>

          <FadeIn>
            <header className="mb-12 space-y-4">
              <Chip
                size="sm"
                variant="soft"
                color="accent"
                className="border border-border/70 bg-bg-card/60 backdrop-blur"
              >
                <ScrollText
                  className="size-3.5 text-accent-bright"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-widest">
                  Release history
                </span>
              </Chip>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
                Changelog
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-[640px]">
                {CHANGELOG_RELEASE_COUNT} releases shipped — every feature,
                fix, and security improvement on the record.
                {latest ? (
                  <>
                    {" "}
                    Latest:{" "}
                    <strong className="text-text-primary font-[family-name:var(--font-mono)]">
                      v{latest.version}
                    </strong>{" "}
                    on{" "}
                    <strong className="text-text-primary">
                      {latest.date}
                    </strong>
                    .
                  </>
                ) : null}
              </p>
            </header>
          </FadeIn>

          <FadeIn delay={0.1}>
            <ChangelogList />
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
