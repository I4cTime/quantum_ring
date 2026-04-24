---
name: qring:dashboard
description: Start the q-ring local status dashboard (SSE + browser UI). Use when the user wants a live view of secret health without exposing values.
---

# /qring:dashboard

1. Call MCP tool **`status_dashboard`**.
2. Open the returned `http://127.0.0.1:…` URL in a browser (local only).

If the dashboard is already running, the tool reports the existing URL.
