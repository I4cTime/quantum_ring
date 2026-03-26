---
name: rotate-expired
description: Find expired and stale secrets and attempt automatic rotation via their providers.
---

# Rotate Expired Secrets

Find all expired or stale secrets and attempt to rotate them.

## Usage

Invoke via `/qring:rotate-expired`

## Workflow

1. Call `health_check` to identify expired and stale secrets.

2. If no expired or stale secrets exist, report that everything is healthy.

3. For each expired secret:
   a. Call `validate_secret` to confirm it is actually invalid
   b. Call `rotate_secret` to attempt provider-native rotation
   c. Report the result: rotated (with provider name) or failed (with reason)

4. For stale secrets (>75% lifetime), list them as warnings with remaining time.

5. Present a summary:
   - Rotated: N secrets successfully refreshed
   - Failed: N secrets could not be rotated (manual intervention needed)
   - Stale: N secrets approaching expiry
