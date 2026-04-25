import NextLink from "next/link";
import { buttonVariants } from "@heroui/styles";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { BrandGithub } from "@/components/icons/BrandIcons";

export default function FinalCta() {
  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="get-started">
      <div className="max-w-[820px] mx-auto px-6 text-center">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-accent-dim)_0%,transparent_60%)] pointer-events-none"
          aria-hidden
        />
        <div className="relative space-y-5">
          <span className="inline-flex items-center gap-2 text-text-dim text-xs uppercase tracking-widest">
            <Sparkles className="size-3.5 text-accent-bright" aria-hidden />
            Ready when you are
          </span>
          <h2 className="text-[clamp(2.25rem,6vw,3.5rem)] font-extrabold leading-[1.05] bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Stop leaking secrets.
            <br />
            Start shipping with confidence.
          </h2>
          <p className="text-text-secondary text-lg max-w-[640px] mx-auto leading-relaxed">
            Three minutes to install, zero seconds of cloud setup. q-ring meets
            your AI agents where they already live — and your secrets never have
            to.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <NextLink
              href="/docs#quickstart"
              className={`${buttonVariants({ variant: "primary", size: "lg" })} font-semibold`}
            >
              Quick start
              <ArrowRight className="size-4" aria-hidden />
            </NextLink>
            <NextLink
              href="/docs"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} font-semibold`}
            >
              <BookOpen className="size-4" aria-hidden />
              Read the docs
            </NextLink>
            <a
              href="https://github.com/I4cTime/quantum_ring"
              target="_blank"
              rel="noopener"
              className={`${buttonVariants({ variant: "ghost", size: "lg" })} font-semibold`}
            >
              <BrandGithub className="size-4" />
              Star on GitHub
            </a>
          </div>

          <p className="text-text-dim text-xs pt-4">
            Free under AGPL-3.0. No accounts. No telemetry. No vendor lock-in.
          </p>
        </div>
      </div>
    </section>
  );
}
