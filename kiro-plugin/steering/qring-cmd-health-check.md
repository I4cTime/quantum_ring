---
inclusion: manual
---

# q-ring · Health Check (command)

> Activate by typing `#qring-cmd-health-check` in chat.

Run a comprehensive health check on all secrets — decay, anomalies, and audit integrity.

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
