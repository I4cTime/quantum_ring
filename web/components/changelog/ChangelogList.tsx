"use client";

import { useMemo, useState, type Key } from "react";
import { Card, Chip, Pagination, Tabs } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import {
  CalendarDays,
  CircleAlert,
  Hammer,
  PlusCircle,
  RefreshCw,
  ScrollText,
  Search,
  ShieldAlert,
  Tag,
} from "lucide-react";

import {
  CHANGELOG,
  type ChangelogHighlight,
  type ChangeType,
} from "@/lib/data/changelog";

type Filter = "all" | ChangeType;

const FILTERS: {
  id: Filter;
  label: string;
  Icon: typeof PlusCircle;
}[] = [
  { id: "all", label: "All", Icon: ScrollText },
  { id: "added", label: "Added", Icon: PlusCircle },
  { id: "changed", label: "Changed", Icon: RefreshCw },
  { id: "fixed", label: "Fixed", Icon: Hammer },
  { id: "security", label: "Security", Icon: ShieldAlert },
];

const TYPE_COLOR: Record<
  ChangeType,
  "success" | "accent" | "warning" | "danger"
> = {
  added: "success",
  changed: "accent",
  fixed: "warning",
  security: "danger",
};

const TYPE_ICON: Record<ChangeType, typeof PlusCircle> = {
  added: PlusCircle,
  changed: RefreshCw,
  fixed: Hammer,
  security: ShieldAlert,
};

const PAGE_SIZE = 5;

export default function ChangelogList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (filter === "all") return CHANGELOG;
    return CHANGELOG.map((entry) => ({
      ...entry,
      highlights: entry.highlights.filter((h) => h.type === filter),
    })).filter((entry) => entry.highlights.length > 0);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const onFilterChange = (key: Key) => {
    setFilter(key as Filter);
    setPage(1);
  };

  const counts = useMemo(() => {
    const c = { added: 0, changed: 0, fixed: 0, security: 0 };
    for (const entry of CHANGELOG) {
      for (const h of entry.highlights) {
        c[h.type]++;
      }
    }
    return c;
  }, []);

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push("ellipsis");
    const startN = Math.max(2, safePage - 1);
    const endN = Math.min(totalPages - 1, safePage + 1);
    for (let i = startN; i <= endN; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Tabs
          aria-label="Changelog filter"
          selectedKey={filter}
          onSelectionChange={onFilterChange}
          variant="secondary"
        >
          <Tabs.ListContainer>
            <Tabs.List
              aria-label="Filter by change type"
              className="flex-wrap"
            >
              {FILTERS.map((f) => (
                <Tabs.Tab key={f.id} id={f.id} className="!w-auto gap-2">
                  <f.Icon className="size-3.5" strokeWidth={2} aria-hidden />
                  <span>{f.label}</span>
                  {f.id !== "all" ? (
                    <Chip size="sm" variant="soft" className="ml-1">
                      {counts[f.id]}
                    </Chip>
                  ) : null}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        <p className="text-text-dim text-xs inline-flex items-center gap-2">
          <Search className="size-3.5" aria-hidden />
          Showing{" "}
          <strong className="text-text-primary">{filtered.length}</strong>{" "}
          release{filtered.length === 1 ? "" : "s"} matching{" "}
          <strong className="text-text-primary">
            {filter === "all" ? "any change" : filter}
          </strong>
        </p>
      </div>

      {visible.length === 0 ? (
        <Card className="bg-bg-card/40 border border-border/60">
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <CircleAlert className="size-5 text-accent-bright" />
              </EmptyState.Media>
              <EmptyState.Title className="text-text-primary">
                No releases match this filter
              </EmptyState.Title>
              <EmptyState.Description className="text-text-dim">
                Switch to a different change type or reset to “All”.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-5">
          {visible.map((entry, idx) => (
            <ReleaseCard
              key={entry.version}
              entry={entry}
              isLatest={safePage === 1 && filter === "all" && idx === 0}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination className="w-full">
          <Pagination.Summary>
            Page {safePage} of {totalPages} · {filtered.length} release
            {filtered.length === 1 ? "" : "s"}
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={safePage === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Pagination.PreviousIcon />
                <span>Previous</span>
              </Pagination.Previous>
            </Pagination.Item>
            {pageNumbers.map((p, i) =>
              p === "ellipsis" ? (
                <Pagination.Item key={`ellipsis-${i}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={p}>
                  <Pagination.Link
                    isActive={p === safePage}
                    onPress={() => setPage(p)}
                  >
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={safePage === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ) : null}
    </div>
  );
}

function ReleaseCard({
  entry,
  isLatest,
}: {
  entry: { version: string; date: string; highlights: ChangelogHighlight[] };
  isLatest: boolean;
}) {
  return (
    <Card className="bg-bg-card/70 border border-border/70 overflow-hidden">
      <Card.Header className="border-b border-border/60 bg-bg-deep/40 p-5 flex flex-row items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center size-9 rounded-md bg-accent/15 text-accent-bright shrink-0">
            <Tag className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-mono)]">
              {entry.version === "Unreleased" ? "Unreleased" : `v${entry.version}`}
            </h3>
            <p className="text-text-dim text-xs flex items-center gap-1.5 mt-0.5">
              <CalendarDays className="size-3" aria-hidden />
              {entry.date || "in development"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isLatest ? (
            <Chip size="sm" variant="soft" color="accent">
              Latest
            </Chip>
          ) : null}
          <Chip
            size="sm"
            variant="soft"
            color="default"
            className="font-[family-name:var(--font-mono)] text-[0.7rem]"
          >
            {entry.highlights.length} change
            {entry.highlights.length === 1 ? "" : "s"}
          </Chip>
        </div>
      </Card.Header>

      <Card.Content className="p-5">
        <ul className="space-y-3">
          {entry.highlights.map((h, idx) => {
            const Icon = TYPE_ICON[h.type];
            return (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm leading-relaxed"
              >
                <Chip
                  size="sm"
                  variant="soft"
                  color={TYPE_COLOR[h.type]}
                  className="shrink-0 mt-0.5 capitalize gap-1.5 font-semibold"
                >
                  <Icon className="size-3" strokeWidth={2} aria-hidden />
                  {h.type}
                </Chip>
                <span className="text-text-secondary">{h.text}</span>
              </li>
            );
          })}
        </ul>
      </Card.Content>
    </Card>
  );
}
