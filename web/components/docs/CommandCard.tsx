import { Card, Chip } from "@heroui/react";
import { TerminalSquare } from "lucide-react";

import TerminalCard from "@/components/TerminalCard";
import type { CliRefCommand } from "@/lib/data/cli-reference";

type Props = {
  command: CliRefCommand;
};

export default function CommandCard({ command }: Props) {
  return (
    <Card className="bg-bg-card/80 border border-border/70 overflow-hidden">
      <Card.Header className="flex flex-col items-start gap-1.5 p-5 border-b border-border/60 bg-bg-deep/30">
        <div className="flex items-start gap-3 w-full">
          <span className="inline-flex items-center justify-center size-8 rounded-md bg-accent/15 text-accent-bright shrink-0">
            <TerminalSquare className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary font-[family-name:var(--font-mono)] break-words">
              qring {command.command}
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {command.description}
            </p>
          </div>
        </div>
      </Card.Header>

      <Card.Content className="p-5 space-y-4">
        {command.options.length > 0 ? (
          <div className="space-y-2">
            <p className="text-text-dim text-xs uppercase tracking-widest">
              Options
            </p>
            <div className="flex flex-wrap gap-2">
              {command.options.map((opt) => (
                <Chip
                  key={opt}
                  size="sm"
                  variant="soft"
                  className="font-[family-name:var(--font-mono)] text-[0.7rem] bg-accent-dim text-accent-bright border border-border/40"
                >
                  {opt}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-text-dim text-xs italic">
            No command-specific options.
          </p>
        )}

        <div className="space-y-2">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Examples
          </p>
          {command.examples.map((ex) => (
            <TerminalCard
              key={ex}
              title={`qring ${command.command.split(" ")[0]}`}
              copyText={ex}
              maxWidth="100%"
            >
              <pre className="m-0 text-text-secondary text-xs md:text-sm whitespace-pre-wrap break-all">
                <span className="text-emerald-400 font-bold">$</span>{" "}
                <span className="text-accent-bright font-medium">{ex}</span>
              </pre>
            </TerminalCard>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
