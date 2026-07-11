# Releasing q-ring

Releases are tag-driven. One script stages everything; pushing the tag does the rest.

## Flow

```bash
# on develop, with a non-empty [Unreleased] section in CHANGELOG.md
pnpm run release:prepare minor      # or patch / major / an explicit x.y.z
```

`scripts/prepare-release.mjs`:

1. bumps `package.json`,
2. runs `sync-versions` (Cursor + Claude plugin manifests, marketplaces, `server.json`, `SECURITY.md`),
3. rolls the CHANGELOG's `[Unreleased]` into `[x.y.z] — YYYY-MM-DD` and leaves a fresh `[Unreleased]`,
4. runs the plugin-parity check,
5. prints the exact commit/tag/push commands.

Review the diff, merge to `main` per the usual PR flow, then tag and push:

```bash
git tag v0.13.0
git push --tags
```

## What the tag triggers

`.github/workflows/release.yml` (on `v*` tags):

1. **GitHub Release** — created idempotently, with the release notes extracted from that version's CHANGELOG section. Tagging without a matching CHANGELOG section fails the run on purpose.
2. **Publish** (`publish.yml` via `workflow_call`) — npm publish with provenance (idempotent: skips if the version is already on npm), then MCP Registry publish via a pinned `mcp-publisher`.
3. **Homebrew** (`update-homebrew.yml` via `workflow_call`) — waits for the version to appear on npm, regenerates the tap formula with the new tarball sha, and pushes to `I4cTime/homebrew-tap` (skips if unchanged).

Why `workflow_call` instead of the `release: published` event for this path: the workflow creates the release with `GITHUB_TOKEN`, and GitHub does not fire workflow triggers for events created by `GITHUB_TOKEN`. The event triggers remain in place so a release created manually in the GitHub UI still publishes; every downstream step is idempotent, so overlap is harmless (a shared `publish` concurrency group serializes runs).

## Recovering from a failed release

- **npm/MCP publish failed:** fix the cause, then re-run from the Actions tab with `workflow_dispatch` on `publish.yml`, passing the tag as `ref`. The npm step skips if the version already published.
- **Homebrew failed:** re-run the `update-homebrew.yml` job — it re-derives everything from the tag and npm.
- **Wrong notes:** edit the GitHub Release body in the UI; nothing downstream depends on it.
