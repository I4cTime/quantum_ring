"use client";

import { Chip, Table } from "@heroui/react";
import { AlertTriangle, Check, X } from "lucide-react";

const COLUMNS = [
  { id: "feature", label: "Capability" },
  { id: "qring", label: "q-ring", isUs: true },
  { id: "env", label: ".env files" },
  { id: "vault", label: "dotenv-vault" },
  { id: "1p", label: "1Password CLI" },
] as const;

type Cell = "yes" | "no" | "partial" | string;

type Row = {
  feature: string;
  hint?: string;
  qring: Cell;
  env: Cell;
  vault: Cell;
  ["1p"]: Cell;
};

const ROWS: Row[] = [
  {
    feature: "Anchored to OS keyring",
    hint: "macOS Keychain, Linux Secret Service, Windows Credential Vault",
    qring: "yes",
    env: "no",
    vault: "no",
    "1p": "yes",
  },
  {
    feature: "MCP-native (AI agents)",
    hint: "Cursor / Claude / Kiro can read & rotate secrets",
    qring: "yes",
    env: "no",
    vault: "no",
    "1p": "no",
  },
  {
    feature: "Quantum decay (auto-expire)",
    qring: "yes",
    env: "no",
    vault: "no",
    "1p": "no",
  },
  {
    feature: "Per-environment isolation",
    qring: "yes",
    env: "partial",
    vault: "yes",
    "1p": "yes",
  },
  {
    feature: "Free + open source",
    qring: "AGPL-3.0",
    env: "—",
    vault: "no",
    "1p": "no",
  },
  {
    feature: "Audit log of agent reads",
    qring: "yes",
    env: "no",
    vault: "no",
    "1p": "yes",
  },
  {
    feature: "Zero cloud dependency",
    qring: "yes",
    env: "yes",
    vault: "no",
    "1p": "partial",
  },
  {
    feature: "One-shot env injection",
    hint: "qring run -- node app.js",
    qring: "yes",
    env: "yes",
    vault: "yes",
    "1p": "yes",
  },
  {
    feature: "Pre/post-commit hooks",
    qring: "yes",
    env: "no",
    vault: "no",
    "1p": "no",
  },
];

export default function WhyQRing() {
  return (
    <section className="py-20 relative z-1" id="why">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            The honest comparison
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Why q-ring instead of <code className="text-accent-bright">.env</code>?
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            Other tools were built for humans. q-ring is the first secret store
            built so AI coding agents can rotate, decay, and audit credentials
            without ever touching a plaintext file.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden border border-border/70 bg-bg-card/40 backdrop-blur">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Comparison: q-ring vs .env, dotenv-vault, 1Password CLI"
                className="min-w-[720px]"
              >
                <Table.Header>
                  {COLUMNS.map((col) => (
                    <Table.Column
                      key={col.id}
                      isRowHeader={col.id === "feature"}
                      className={
                        "isUs" in col && col.isUs
                          ? "text-accent-bright font-semibold"
                          : ""
                      }
                    >
                      {col.label}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {ROWS.map((row) => (
                    <Table.Row key={row.feature}>
                      <Table.Cell>
                        <div className="flex flex-col">
                          <span className="text-text-primary font-medium">
                            {row.feature}
                          </span>
                          {row.hint ? (
                            <span className="text-text-dim text-xs">
                              {row.hint}
                            </span>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <ComparisonCell value={row.qring} highlight />
                      </Table.Cell>
                      <Table.Cell>
                        <ComparisonCell value={row.env} />
                      </Table.Cell>
                      <Table.Cell>
                        <ComparisonCell value={row.vault} />
                      </Table.Cell>
                      <Table.Cell>
                        <ComparisonCell value={row["1p"]} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        <p className="text-text-dim text-xs text-center mt-4">
          Comparison reflects features at v0.10. PRs to update this table are welcome.
        </p>
      </div>
    </section>
  );
}

function ComparisonCell({
  value,
  highlight,
}: {
  value: Cell;
  highlight?: boolean;
}) {
  if (value === "yes") {
    return (
      <Chip
        size="sm"
        variant="soft"
        color={highlight ? "accent" : "success"}
        aria-label="Supported"
      >
        <Check className="size-3.5" aria-hidden />
      </Chip>
    );
  }
  if (value === "no") {
    return (
      <Chip
        size="sm"
        variant="soft"
        color="danger"
        aria-label="Not supported"
      >
        <X className="size-3.5" aria-hidden />
      </Chip>
    );
  }
  if (value === "partial") {
    return (
      <Chip
        size="sm"
        variant="soft"
        color="warning"
        aria-label="Partial support"
      >
        <AlertTriangle className="size-3.5" aria-hidden />
      </Chip>
    );
  }
  if (value === "—") {
    return <span className="text-text-dim text-sm">—</span>;
  }
  return (
    <Chip
      size="sm"
      variant={highlight ? "primary" : "soft"}
      color={highlight ? "accent" : "default"}
    >
      {value}
    </Chip>
  );
}
