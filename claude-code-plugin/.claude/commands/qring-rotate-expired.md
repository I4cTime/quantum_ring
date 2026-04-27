---
description: Find expired and stale secrets and attempt automatic rotation via their providers.
allowed-tools: mcp__q-ring__health_check, mcp__q-ring__validate_secret, mcp__q-ring__rotate_secret, mcp__q-ring__list_secrets, mcp__q-ring__inspect_secret
---

# /qring-rotate-expired

Find all expired or stale secrets and attempt to rotate them.

## Workflow

1. Call `health_check` to identify expired and stale secrets.
2. If no expired or stale secrets exist, report that everything is healthy and stop.
3. For each expired secret:
   1. Call `validate_secret` to confirm it is actually invalid.
   2. Call `rotate_secret` to attempt provider-native rotation.
   3. Report the result: rotated (with provider name) or failed (with reason).
4. For stale secrets (> 75% lifetime), list them as warnings with remaining time.
5. Present a summary:
   - **Rotated:** N secrets successfully refreshed
   - **Failed:** N secrets could not be rotated (manual intervention needed)
   - **Stale:** N secrets approaching expiry
