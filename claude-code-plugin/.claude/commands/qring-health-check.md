---
description: Run a comprehensive q-ring health check — decay, anomalies, and audit chain integrity.
allowed-tools: mcp__q-ring__health_check, mcp__q-ring__detect_anomalies, mcp__q-ring__verify_audit_chain, mcp__q-ring__list_secrets
---

# /qring-health-check

Run a full health assessment of all secrets managed by q-ring.

## Workflow

1. Call `health_check` to assess all secrets:
   - Count healthy, stale (> 75% lifetime), and expired secrets
   - Note any secrets without decay tracking
2. Call `detect_anomalies` to check for suspicious access patterns:
   - Burst reads on a single key
   - Access at unusual hours
   - Access from new/unknown sources
3. Call `verify_audit_chain` to confirm the audit log has not been tampered with:
   - Report total events and valid count
   - If broken, show the break point
4. Present a summary report:
   - Secrets: X healthy, Y stale, Z expired
   - Anomalies: count and type
   - Audit chain: intact or broken at event N
   - Recommendations for any issues found
