"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "motion/react";

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
}

const stats: StatItem[] = [
  { value: 44, label: "MCP Tools" },
  { value: 13, label: "Quantum Features" },
  { value: 6, label: "Tiers" },
  { value: 5, label: "Platforms" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayed}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="py-16 relative z-1">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              className="relative rounded-md p-px bg-gradient-to-br from-accent/20 via-[rgba(168,85,247,0.15)] to-accent/20"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              <div className="bg-bg-card rounded-[calc(var(--radius-md)-1px)] px-6 py-8 text-center h-full">
                <div className="text-4xl md:text-5xl font-extrabold text-text-primary mb-2">
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-text-secondary font-medium uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
