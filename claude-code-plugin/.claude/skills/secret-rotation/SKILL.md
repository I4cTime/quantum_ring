---
name: secret-rotation
description: Validate, rotate, and batch-check secrets against their providers. Use when the user mentions expired keys, secret rotation, validation, CI secret checks, stale credentials, or provider liveness testing.
---

# Secret Rotation and Validation

## When to use

Activate when the user:
- Mentions expired, stale, or invalid secrets
- Asks to rotate or refresh API keys
- Wants to validate that secrets are still working
- Needs CI-friendly batch validation
- Asks about secret health or decay status

## Workflow

### 1. Health check

Call `health_check` to get a full report of all secrets:
- **Expired** — TTL elapsed or `expiresAt` passed
- **Stale** — over 75% of lifetime consumed
- **Healthy** — within acceptable range
- Also returns anomaly count and overall status

### 2. Validate individual secrets

Call `validate_secret` with a key name. Supported providers with auto-detection:
- **OpenAI** — keys starting with `sk-`
- **Stripe** — keys starting with `sk_live_` or `sk_test_`
- **GitHub** — tokens starting with `ghp_`, `gho_`, `ghs_`
- **AWS** — keys starting with `AKIA`
- **Generic HTTP** — any URL-based validation endpoint

Returns: `valid`, `invalid`, `error`, or `unknown` with latency and provider info.

### 3. Rotate expired secrets

Call `rotate_secret` with the key name. q-ring will:
- Attempt provider-native rotation if a provider is configured
- Fall back to local generation using the secret's `rotationFormat` and `rotationPrefix`
- Update the stored value and fire any registered hooks

### 4. Batch CI validation

Call `ci_validate_secrets` for a structured pass/fail report suitable for CI pipelines. Returns:
- Per-secret validation results
- Rotation recommendations
- Overall pass/fail status

### 5. List available providers

Call `list_providers` to see all supported validation providers with their prefix patterns and descriptions.

### 6. Dashboard and autonomous scans

- **`status_dashboard`** — starts the local quantum status dashboard (browser UI on localhost).
- **`agent_scan`** — one-shot health scan JSON (same family as CLI `qring agent --once`).

## Best practices

- Store secrets with `rotationFormat` (e.g., `api-key`, `password`, `uuid`) to enable automatic rotation
- Set `provider` metadata for automatic validation detection
- Run `ci_validate_secrets` in CI pipelines to catch expired credentials before deployment
