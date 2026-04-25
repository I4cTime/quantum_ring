"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@heroui-pro/react";
import { Chip, Label, SearchField } from "@heroui/react";
import { SearchX } from "lucide-react";

import CommandCard from "@/components/docs/CommandCard";
import { CLI_REFERENCE } from "@/lib/data/cli-reference";

export default function CliReferenceList() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CLI_REFERENCE;
    return CLI_REFERENCE.filter((cmd) => {
      if (cmd.command.toLowerCase().includes(q)) return true;
      if (cmd.description.toLowerCase().includes(q)) return true;
      return cmd.options.some((opt) => opt.toLowerCase().includes(q));
    });
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
        <SearchField
          fullWidth
          name="cli-search"
          variant="secondary"
          value={query}
          onChange={setQuery}
          className="flex-1"
        >
          <Label className="text-text-dim text-xs uppercase tracking-widest">
            Filter commands
          </Label>
          <SearchField.Group className="bg-bg-card/60 border-border/70">
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Try “rotate”, “tunnel”, or “--project-path”" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Chip
          variant="soft"
          color="default"
          className="self-start sm:self-end mb-1.5 font-[family-name:var(--font-mono)] text-[0.7rem]"
        >
          {filtered.length} of {CLI_REFERENCE.length}
        </Chip>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-bg-card/40 p-6">
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <SearchX className="size-5 text-accent-bright" />
              </EmptyState.Media>
              <EmptyState.Title className="text-text-primary">
                No matching commands
              </EmptyState.Title>
              <EmptyState.Description className="text-text-dim">
                Try a shorter search term or clear the filter.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        </div>
      ) : (
        filtered.map((cmd) => <CommandCard key={cmd.command} command={cmd} />)
      )}
    </div>
  );
}
