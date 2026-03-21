# q-ring Publishing & Release Log

This document tracks the end-to-end publishing journey for the `q-ring` package across multiple ecosystems (npm, GitHub, Glama, Docker).

## 📦 Current Status
- **Package Name:** `@i4ctime/q-ring`
- **Current Version:** `0.2.7`
- **License:** AGPL-3.0-only
- **Repository:** https://github.com/I4cTime/quantum_ring
- **Documentation Site:** https://i4ctime.github.io/quantum_ring/

---

## ✅ Completed Milestones

### 1. Repository Setup & Core
- [x] Codebase initialized in TypeScript ESM.
- [x] `tsup` configured for dual builds (`dist/index.js` for CLI, `dist/mcp.js` for MCP).
- [x] Dependencies locked down via `pnpm` (`pnpm-lock.yaml`).
- [x] License updated to **AGPL-3.0-only** to ensure any hosted services release their source code and to comply with Glama requirements.
- [x] Repository and bug URLs standardized to `I4cTime/quantum_ring` in `package.json`.

### 2. Marketing & Brand Assets
- [x] Created `logo.png` (neon quantum shield) and optimized `social-card-optimized.jpg`.
- [x] Assets committed to the repository and pointed to via `unpkg` in the README for consistent rendering on npm.
- [x] GitHub Pages landing site designed and deployed at `https://i4ctime.github.io/quantum_ring/` featuring interactive WebGL particles, custom SVGs, and feature breakdowns.
- [x] `package.json` homepage URL updated to point to the GitHub Pages site.
- [x] Accessibility Audit completed (see `docs/a11y-audit-2026-03-20.md`).

### 3. Docker & Glama Integration
- [x] `Dockerfile` created using Debian base, Node 24, and `pnpm`.
- [x] `CMD` updated to execute `./dist/mcp.js` directly for Glama.
- [x] Created `glama.json` to assign ownership to `maintainers: ["I4cTime"]`.
- [x] Dockerfile explicitly copies source files (`COPY . .`) to bypass "git clone" auth issues during local/isolated builds.

### 4. Git & Release Management
- [x] Force-pushed and reconciled the `v0.2.6` tag discrepancy on GitHub.
- [x] Successfully authenticated via GitHub CLI (`gh auth login`) to resolve HTTPS push issues.
- [x] Published `gh-pages` branch for static documentation.

---

## 🚀 Next Steps / Pending Pipeline

### 1. npm Publish
Currently blocked because the `@i4ctime` scope needs to be linked to your npm account.
- [ ] Run `npm whoami` to verify the logged-in user.
- [ ] If logged in as another user, create an npm organization named `i4ctime` and invite your user, OR rename the package scope to match your user.
- [ ] Run `npm publish --access public` (the pre-publish build scripts are already configured).

### 2. GitHub Release
- [ ] Create an official GitHub Release for version `v0.2.7`.
- [ ] Generate changelog notes outlining the transition to AGPL-3.0, the new GitHub Pages site, and the Glama support.

### 3. Glama Sync
- [ ] Re-run the Glama claim/sync process now that the tag (`v0.2.6` / `v0.2.7`), `glama.json`, and the updated `Dockerfile` are successfully pushed to `main`.
- [ ] Verify the MCP proxy correctly spins up the Docker container on the Glama platform.

### 4. Accessibility Fixes (Optional but Recommended)
- [ ] Work through the P0 / Critical issues logged in `docs/a11y-audit-2026-03-20.md` on the `gh-pages` branch (e.g. adding a skip link, focus rings, and prefers-reduced-motion).

---

## 📝 Release Checklist

When cutting a new version, follow these steps:
1. Update `version` in `package.json`.
2. Run `pnpm install` to update `pnpm-lock.yaml`.
3. Commit the version bump: `git commit -am "chore: bump version to vX.Y.Z"`.
4. Create the git tag: `git tag vX.Y.Z`.
5. Push to GitHub: `git push origin main --tags`.
6. Publish to npm: `npm publish --access public`.
7. Draft a new GitHub Release based on the tag.
