#!/usr/bin/env node
/**
 * Prepare a release in one step:
 *
 *   pnpm run release:prepare patch     # 0.12.0 -> 0.12.1
 *   pnpm run release:prepare minor     # 0.12.0 -> 0.13.0
 *   pnpm run release:prepare major     # 0.12.0 -> 1.0.0
 *   pnpm run release:prepare 0.13.0    # explicit version
 *
 * What it does:
 *   1. bumps package.json version
 *   2. runs sync-versions (plugin manifests, server.json, SECURITY.md)
 *   3. rolls CHANGELOG.md: [Unreleased] -> [x.y.z] — YYYY-MM-DD, fresh [Unreleased]
 *   4. runs the parity check
 *   5. prints the commit/tag/push steps — pushing the tag triggers
 *      .github/workflows/release.yml, which creates the GitHub Release and
 *      chains npm + MCP Registry publish and the Homebrew tap update.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];

if (!arg) {
  console.error("usage: prepare-release.mjs <patch|minor|major|x.y.z>");
  process.exit(1);
}

const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [maj, min, pat] = pkg.version.split(".").map(Number);

let next;
if (arg === "patch") next = `${maj}.${min}.${pat + 1}`;
else if (arg === "minor") next = `${maj}.${min + 1}.0`;
else if (arg === "major") next = `${maj + 1}.0.0`;
else if (/^\d+\.\d+\.\d+$/.test(arg)) next = arg;
else {
  console.error(`prepare-release: "${arg}" is not patch|minor|major or x.y.z`);
  process.exit(1);
}

// 1. package.json
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`✓ package.json ${maj}.${min}.${pat} -> ${next}`);

// 2. manifests
execSync("node scripts/sync-versions.mjs", { cwd: root, stdio: "inherit" });

// 3. CHANGELOG roll
const changelogPath = join(root, "CHANGELOG.md");
let changelog = readFileSync(changelogPath, "utf8");
if (!changelog.includes("## [Unreleased]")) {
  console.error("prepare-release: CHANGELOG.md has no [Unreleased] section");
  process.exit(1);
}
const unreleasedBody = changelog
  .split("## [Unreleased]")[1]
  .split(/\n## \[/)[0]
  .trim();
if (!unreleasedBody) {
  console.error("prepare-release: [Unreleased] section is empty — nothing to release");
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
changelog = changelog.replace(
  "## [Unreleased]",
  `## [Unreleased]\n\n## [${next}] — ${today}`,
);
writeFileSync(changelogPath, changelog, "utf8");
console.log(`✓ CHANGELOG.md: [Unreleased] rolled into [${next}] — ${today}`);

// 4. guards
execSync("node scripts/check-plugin-parity.mjs", { cwd: root, stdio: "inherit" });

// 5. next steps
console.log(`
Release ${next} is staged. Review the diff, then:

  git add -A
  git commit -m "release: v${next}"
  git tag v${next}
  git push && git push --tags

Pushing the tag runs the Release workflow: GitHub Release (notes from the
CHANGELOG section) -> npm + MCP Registry publish -> Homebrew tap update.
`);
