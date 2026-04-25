---
name: qring:dashboard
description: Start the q-ring local status dashboard (SSE + browser UI). Use when the user wants a live view of secret health, manifest gaps, policy posture, approvals, hooks, and audit traffic without exposing secret values.
---

# /qring:dashboard

1. Call MCP tool **`status_dashboard`**.
2. Open the returned `http://127.0.0.1:…` URL in a browser (local only — bound to loopback).

If the dashboard is already running, the tool reports the existing URL instead of starting a second listener.

## What the page shows

- **KPI strip** — total secrets, detected env, protected count, active approvals, hooks, 24h reads/writes, denied actions, and live anomaly count.
- **Health summary** — donut of healthy / stale / expired / no-decay secrets with per-scope breakdown.
- **Environment** — wavefunction collapse details (env, source, branch).
- **Manifest** — declared / required / missing / expired / stale keys from `.q-ring.json`.
- **Policy** — MCP / exec / secret policy presence with allow-deny / approval / rotation counts.
- **Secrets table** — sortable, searchable view of every secret with quick chips for `expired`, `stale`, `protected`.
- **Quantum cards** — decay timers, superposition states, entanglement pairs, active tunnels.
- **Approvals & hooks** — live grants and registered hooks with tamper / expiry state and match summaries.
- **Agent memory** — count of encrypted memory keys.
- **Anomaly alerts + audit feed** — filterable by action and source with free-text search.

## Controls

- Top bar: pause SSE updates, force refresh, jump to raw JSON (`/api/status`).
- Keyboard: `/` focus secrets search · `P` pause · `R` refresh · `Esc` blur input.

## Important

The dashboard never renders secret **values** — only metadata. It is safe to share a screenshot for debugging, but the bound URL stays on `127.0.0.1` and should not be exposed beyond the local machine.
