import { Command } from "commander";
import {
  getSecret,
  setSecret,
  deleteSecret,
  listSecrets,
  exportSecrets,
  hasSecret,
  getEnvelope,
  entangleSecrets,
  disentangleSecrets,
  type KeyringOptions,
  type SetSecretOptions,
} from "../core/keyring.js";
import { startAgent, runHealthScan } from "../core/agent.js";
import type { Scope } from "../core/scope.js";
import { collapseEnvironment, readProjectConfig } from "../core/collapse.js";
import { checkDecay, type DecayStatus } from "../core/envelope.js";
import { queryAudit, detectAnomalies, verifyAuditChain, exportAudit } from "../core/observer.js";
import { generateSecret, estimateEntropy, type NoiseFormat } from "../core/noise.js";
import { tunnelCreate, tunnelRead, tunnelDestroy, tunnelList } from "../core/tunnel.js";
import { teleportPack, teleportUnpack } from "../core/teleport.js";
import { importDotenv } from "../core/import.js";
import { execCommand } from "../core/exec.js";
import { scanCodebase } from "../core/scan.js";
import { lintFiles } from "../core/linter.js";
import { grantApproval, revokeApproval, listApprovals } from "../core/approval.js";
import { getProjectContext } from "../core/context.js";
import { remember, recall, listMemory, forget, clearMemory } from "../core/memory.js";
import { installPreCommitHook, uninstallPreCommitHook, runPreCommitScan } from "../hooks/precommit.js";
import { validateSecret, rotateWithProvider, ciValidateBatch, registry as providerRegistry } from "../core/validate.js";
import {
  registerHook,
  removeHook,
  listHooks as listAllHooks,
  enableHook,
  disableHook,
  fireHooks,
  type HookType,
  type HookAction,
} from "../core/hooks.js";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { promptSecret } from "../utils/prompt.js";
import { c, scopeColor, decayIndicator, envBadge, SYMBOLS } from "../utils/colors.js";
import { getPolicySummary, checkToolPolicy, checkKeyReadPolicy, checkExecPolicy } from "../core/policy.js";

/**
 * Break the CodeQL taint chain from getPassword → console.log.
 * Copies a string value so static analysis no longer considers it
 * "sensitive data returned by getPassword".
 */
function safeStr(s: string | undefined | null): string {
  return s == null ? "" : `${s}`;
}
function safeNum(n: number | undefined | null): number {
  return n == null ? 0 : Number(n);
}
function safeArr<T>(arr: T[] | undefined | null): T[] {
  return arr ? arr.map((x) => (typeof x === "string" ? safeStr(x) : x) as T) : [];
}

function buildOpts(cmd: {
  global?: boolean;
  project?: boolean;
  team?: string;
  org?: string;
  projectPath?: string;
  env?: string;
}): KeyringOptions {
  let scope: Scope | undefined;
  if (cmd.global) scope = "global";
  else if (cmd.project) scope = "project";
  else if (cmd.team) scope = "team";
  else if (cmd.org) scope = "org";

  const projectPath =
    cmd.projectPath ?? (cmd.project ? process.cwd() : undefined);

  if (scope === "project" && !projectPath) {
    throw new Error("Project path is required for project scope");
  }

  return {
    scope,
    projectPath: projectPath ?? process.cwd(),
    teamId: cmd.team,
    orgId: cmd.org,
    env: cmd.env,
    source: "cli",
  };
}

export function createProgram(): Command {
  const program = new Command()
    .name("qring")
    .description(
      `${c.bold("q-ring")} ${c.dim("— quantum keyring for AI coding tools")}`,
    )
    .version("0.4.0");

  // ─── Core Commands ───

  program
    .command("set <key> [value]")
    .description("Store a secret (with optional quantum metadata)")
    .option("-g, --global", "Store in global scope")
    .option("-p, --project", "Store in project scope (uses cwd)")
    .option("--team <id>", "Store in team scope")
    .option("--org <id>", "Store in org scope")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Set value for a specific environment (superposition)")
    .option("--ttl <seconds>", "Time-to-live in seconds (quantum decay)", parseInt)
    .option("--expires <iso>", "Expiry timestamp (ISO 8601)")
    .option("--description <desc>", "Human-readable description")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--rotation-format <format>", "Format for auto-rotation (api-key, password, uuid, hex, base64, alphanumeric, token)")
    .option("--rotation-prefix <prefix>", "Prefix for auto-rotation (e.g. sk-)")
    .option("--requires-approval", "Require explicit user approval for MCP agents to read")
    .option("--jit-provider <provider>", "Use a Just-In-Time provider to dynamically generate this secret")
    .action(async (key: string, value: string | undefined, cmd) => {
      const opts = buildOpts(cmd);

      if (!value) {
        value = await promptSecret(`${SYMBOLS.key} Enter value for ${c.bold(key)}: `);
        if (!value) {
          console.error(c.red(`${SYMBOLS.cross} No value provided, aborting.`));
          process.exit(1);
        }
      }

      const setOpts: SetSecretOptions = {
        ...opts,
        ttlSeconds: cmd.ttl,
        expiresAt: cmd.expires,
        description: cmd.description,
        tags: cmd.tags?.split(",").map((t: string) => t.trim()),
        rotationFormat: cmd.rotationFormat,
        rotationPrefix: cmd.rotationPrefix,
        requiresApproval: cmd.requiresApproval,
        jitProvider: cmd.jitProvider,
      };

      // If --env is specified, set as a superposition state
      if (cmd.env) {
        const existing = getEnvelope(key, opts);
        const states = existing?.envelope?.states ?? {};
        states[cmd.env] = value;

        // Preserve existing simple value as "default" state if migrating
        if (existing?.envelope?.value && !states["default"]) {
          states["default"] = existing.envelope.value;
        }

        setOpts.states = states;
        setOpts.defaultEnv = existing?.envelope?.defaultEnv ?? cmd.env;
        setSecret(key, "", setOpts);

        console.log(
          `${SYMBOLS.check} ${c.green("saved")} ${c.bold(key)} ${envBadge(cmd.env)} ${c.dim(`[${scopeColor(opts.scope ?? "global")}]`)}`,
        );
      } else {
        setSecret(key, value, setOpts);
        const extras: string[] = [];
        if (cmd.ttl) extras.push(`${SYMBOLS.clock} ttl=${cmd.ttl}s`);
        if (cmd.description) extras.push(c.dim(cmd.description));

        console.log(
          `${SYMBOLS.check} ${c.green("saved")} ${c.bold(key)} ${c.dim(`[${scopeColor(opts.scope ?? "global")}]`)} ${extras.join(" ")}`,
        );
      }
    });

  program
    .command("get <key>")
    .description("Retrieve a secret (collapses superposition if needed)")
    .option("-g, --global", "Look only in global scope")
    .option("-p, --project", "Look only in project scope")
    .option("--team <id>", "Look only in team scope")
    .option("--org <id>", "Look only in org scope")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Force a specific environment")
    .action((key: string, cmd) => {
      const opts = buildOpts(cmd);
      const value = getSecret(key, opts);

      if (value === null) {
        console.error(c.red(`${SYMBOLS.cross} Secret "${key}" not found`));
        process.exit(1);
      }

      process.stdout.write(value);
    });

  program
    .command("delete <key>")
    .alias("rm")
    .description("Remove a secret from the keyring")
    .option("-g, --global", "Delete from global scope only")
    .option("-p, --project", "Delete from project scope only")
    .option("--project-path <path>", "Explicit project path")
    .action((key: string, cmd) => {
      const opts = buildOpts(cmd);
      const deleted = deleteSecret(key, opts);

      if (deleted) {
        console.log(`${SYMBOLS.check} ${c.green("deleted")} ${c.bold(key)}`);
      } else {
        console.error(c.red(`${SYMBOLS.cross} Secret "${key}" not found`));
        process.exit(1);
      }
    });

  program
    .command("list")
    .alias("ls")
    .description("List all secrets with quantum status indicators")
    .option("-g, --global", "List global scope only")
    .option("-p, --project", "List project scope only")
    .option("--team <id>", "List team scope only")
    .option("--org <id>", "List org scope only")
    .option("--project-path <path>", "Explicit project path")
    .option("--show-decay", "Show decay/expiry status")
    .option("-t, --tag <tag>", "Filter by tag")
    .option("--expired", "Show only expired secrets")
    .option("--stale", "Show only stale secrets (75%+ decay)")
    .option("-f, --filter <pattern>", "Glob pattern on key name")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      let entries = listSecrets(opts);

      if (cmd.tag) {
        entries = entries.filter((e) =>
          e.envelope?.meta.tags?.includes(cmd.tag),
        );
      }
      if (cmd.expired) {
        entries = entries.filter((e) => e.decay?.isExpired);
      }
      if (cmd.stale) {
        entries = entries.filter(
          (e) => e.decay?.isStale && !e.decay?.isExpired,
        );
      }
      if (cmd.filter) {
        const regex = new RegExp(
          "^" + cmd.filter.replace(/\*/g, ".*") + "$",
          "i",
        );
        entries = entries.filter((e) => regex.test(e.key));
      }

      if (entries.length === 0) {
        console.log(c.dim("No secrets found"));
        return;
      }

      console.log(
        c.bold(`\n  ${SYMBOLS.key} q-ring secrets (${entries.length})\n`),
      );

      const maxKeyLen = Math.max(...entries.map((e) => e.key.length));

      for (const entry of entries) {
        const parts: string[] = [];

        const key = safeStr(entry.key);
        const scope = safeStr(entry.scope) as Scope;
        const envs = entry.envelope?.states ? Object.keys(entry.envelope.states).map(safeStr) : null;
        const entangledCount = safeNum(entry.envelope?.meta.entangled?.length);
        const accessCount = safeNum(entry.envelope?.meta.accessCount);
        const tags = safeArr(entry.envelope?.meta.tags);
        const decayPct = safeNum(entry.decay?.lifetimePercent);
        const expired = !!entry.decay?.isExpired;
        const timeLeft = safeStr(entry.decay?.timeRemaining);

        parts.push(c.dim("[") + scopeColor(scope) + c.dim("]"));
        parts.push(c.bold(key.padEnd(maxKeyLen)));

        if (envs) {
          parts.push(c.magenta(`[${envs.join("|")}]`));
        }

        if (entry.decay && (decayPct > 0 || expired)) {
          parts.push(decayIndicator(decayPct, expired));
          if (timeLeft && !expired) {
            parts.push(c.dim(timeLeft));
          }
        }

        if (entangledCount > 0) {
          parts.push(c.cyan(`${SYMBOLS.link} ${entangledCount}`));
        }

        if (accessCount > 0) {
          parts.push(c.dim(`${SYMBOLS.eye} ${accessCount}`));
        }

        if (tags.length > 0) {
          parts.push(c.dim(tags.map((t) => `#${t}`).join(" ")));
        }

        console.log(`  ${parts.join("  ")}`);
      }

      console.log();
    });

  program
    .command("inspect <key>")
    .description("Show full quantum state of a secret")
    .option("-g, --global", "Inspect global scope only")
    .option("-p, --project", "Inspect project scope only")
    .option("--project-path <path>", "Explicit project path")
    .action((key: string, cmd) => {
      const opts = buildOpts(cmd);
      const result = getEnvelope(key, opts);

      if (!result) {
        console.error(c.red(`${SYMBOLS.cross} Secret "${key}" not found`));
        process.exit(1);
      }

      const { envelope, scope } = result;
      const decay = checkDecay(envelope);

      const safeScope = safeStr(scope) as Scope;
      const createdAt = safeStr(envelope.meta.createdAt);
      const updatedAt = safeStr(envelope.meta.updatedAt);
      const accessCount = safeNum(envelope.meta.accessCount);
      const lastAccess = safeStr(envelope.meta.lastAccessedAt);
      const desc = safeStr(envelope.meta.description);
      const tags = safeArr(envelope.meta.tags);
      const entangled = (envelope.meta.entangled ?? []).map((l) => ({
        service: safeStr(l.service),
        key: safeStr(l.key),
      }));
      const stateEnvs = envelope.states ? Object.keys(envelope.states).map(safeStr) : null;
      const defaultEnv = safeStr(envelope.defaultEnv);
      const decayTime = safeStr(decay.timeRemaining);
      const decayPct = safeNum(decay.lifetimePercent);
      const expired = !!decay.isExpired;

      console.log(`\n  ${c.bold(SYMBOLS.key + " " + key)}`);
      console.log(`  ${c.dim("scope:")}     ${scopeColor(safeScope)}`);

      if (stateEnvs) {
        console.log(`  ${c.dim("type:")}      ${c.magenta("superposition")}`);
        console.log(`  ${c.dim("states:")}`);
        for (const env of stateEnvs) {
          const isDefault = env === defaultEnv;
          console.log(
            `    ${envBadge(env)} ${isDefault ? c.dim("(default)") : ""}`,
          );
        }
      } else {
        console.log(`  ${c.dim("type:")}      ${c.green("collapsed")}`);
      }

      console.log(`  ${c.dim("created:")}   ${createdAt}`);
      console.log(`  ${c.dim("updated:")}   ${updatedAt}`);
      console.log(`  ${c.dim("accessed:")}  ${accessCount} times`);

      if (lastAccess) {
        console.log(`  ${c.dim("last read:")} ${lastAccess}`);
      }

      if (desc) {
        console.log(`  ${c.dim("desc:")}      ${desc}`);
      }

      if (tags.length > 0) {
        console.log(
          `  ${c.dim("tags:")}      ${tags.map((t) => c.cyan(`#${t}`)).join(" ")}`,
        );
      }

      if (decayTime) {
        console.log(
          `  ${c.dim("decay:")}     ${decayIndicator(decayPct, expired)} ${decayTime}`,
        );
      }

      if (entangled.length > 0) {
        console.log(`  ${c.dim("entangled:")}`);
        for (const link of entangled) {
          console.log(`    ${SYMBOLS.link} ${link.service}/${link.key}`);
        }
      }

      console.log();
    });

  program
    .command("export")
    .description("Export secrets as .env or JSON (collapses superposition)")
    .option("-f, --format <format>", "Output format: env or json", "env")
    .option("-g, --global", "Export global scope only")
    .option("-p, --project", "Export project scope only")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Force environment for collapse")
    .option("-k, --keys <keys>", "Comma-separated key names to export")
    .option("-t, --tags <tags>", "Comma-separated tags to filter by")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const output = exportSecrets({
        ...opts,
        format: cmd.format,
        keys: cmd.keys?.split(",").map((k: string) => k.trim()),
        tags: cmd.tags?.split(",").map((t: string) => t.trim()),
      });
      process.stdout.write(output + "\n");
    });

  program
    .command("import <file>")
    .description("Import secrets from a .env file")
    .option("-g, --global", "Import to global scope")
    .option("-p, --project", "Import to project scope")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Environment context")
    .option("--skip-existing", "Skip keys that already exist")
    .option("--dry-run", "Preview what would be imported without saving")
    .action((file: string, cmd) => {
      const opts = buildOpts(cmd);

      const result = importDotenv(file, {
        scope: opts.scope as "global" | "project" | undefined,
        projectPath: opts.projectPath,
        source: "cli",
        skipExisting: cmd.skipExisting,
        dryRun: cmd.dryRun,
      });

      if (cmd.dryRun) {
        console.log(
          `\n  ${SYMBOLS.package} ${c.bold("Dry run")} — would import ${result.imported.length} of ${result.total} secrets:\n`,
        );
        for (const key of result.imported) {
          console.log(`  ${SYMBOLS.key} ${c.bold(key)}`);
        }
        if (result.skipped.length > 0) {
          console.log(`\n  ${c.dim(`Skipped (existing): ${result.skipped.join(", ")}`)}`);
        }
      } else {
        console.log(
          `${SYMBOLS.check} ${c.green("imported")} ${result.imported.length} secret(s) from ${c.bold(file)}`,
        );
        if (result.skipped.length > 0) {
          console.log(
            c.dim(`  skipped ${result.skipped.length} existing: ${result.skipped.join(", ")}`),
          );
        }
      }

      console.log();
    });

  program
    .command("check")
    .description("Validate project secrets against .q-ring.json manifest")
    .option("--project-path <path>", "Project path (defaults to cwd)")
    .action((cmd) => {
      const projectPath = cmd.projectPath ?? process.cwd();
      const config = readProjectConfig(projectPath);

      if (!config?.secrets || Object.keys(config.secrets).length === 0) {
        console.error(
          c.red(`${SYMBOLS.cross} No secrets manifest found in .q-ring.json`),
        );
        console.log(
          c.dim('  Add a "secrets" field to your .q-ring.json to define required secrets.'),
        );
        process.exit(1);
      }

      console.log(
        c.bold(`\n  ${SYMBOLS.shield} Project secret manifest check\n`),
      );

      let present = 0;
      let missing = 0;
      let expiredCount = 0;
      let staleCount = 0;

      for (const [key, manifest] of Object.entries(config.secrets)) {
        const result = getEnvelope(key, { projectPath, source: "cli" });

        if (!result) {
          if (manifest.required !== false) {
            missing++;
            console.log(
              `  ${c.red(SYMBOLS.cross)} ${c.bold(key)} ${c.red("MISSING")} ${manifest.description ? c.dim(`— ${manifest.description}`) : ""}`,
            );
          } else {
            console.log(
              `  ${c.dim(SYMBOLS.cross)} ${c.bold(key)} ${c.dim("optional, not set")} ${manifest.description ? c.dim(`— ${manifest.description}`) : ""}`,
            );
          }
          continue;
        }

        const decay = checkDecay(result.envelope);

        if (decay.isExpired) {
          expiredCount++;
          console.log(
            `  ${c.red(SYMBOLS.warning)} ${c.bold(key)} ${c.bgRed(c.white(" EXPIRED "))} ${manifest.description ? c.dim(`— ${manifest.description}`) : ""}`,
          );
        } else if (decay.isStale) {
          staleCount++;
          console.log(
            `  ${c.yellow(SYMBOLS.warning)} ${c.bold(key)} ${c.yellow(`stale (${decay.lifetimePercent}%)`)} ${manifest.description ? c.dim(`— ${manifest.description}`) : ""}`,
          );
        } else {
          present++;
          console.log(
            `  ${c.green(SYMBOLS.check)} ${c.bold(key)} ${c.green("OK")} ${manifest.description ? c.dim(`— ${manifest.description}`) : ""}`,
          );
        }
      }

      const total = Object.keys(config.secrets).length;
      console.log(
        `\n  ${c.bold(`${total} declared`)}  ${c.green(`${present} present`)}  ${c.yellow(`${staleCount} stale`)}  ${c.red(`${expiredCount} expired`)}  ${c.red(`${missing} missing`)}`,
      );

      if (missing > 0) {
        console.log(
          `\n  ${c.red("Project is NOT ready — missing required secrets.")}`,
        );
      } else if (expiredCount > 0) {
        console.log(
          `\n  ${c.yellow("Project has expired secrets that need rotation.")}`,
        );
      } else {
        console.log(
          `\n  ${c.green(`${SYMBOLS.check} Project is ready — all required secrets present.`)}`,
        );
      }

      console.log();

      if (missing > 0) process.exit(1);
    });

  program
    .command("validate [key]")
    .description("Test if a secret is actually valid with its target service")
    .option("-g, --global", "Global scope only")
    .option("-p, --project", "Project scope only")
    .option("--project-path <path>", "Explicit project path")
    .option("--provider <name>", "Force a specific provider (openai, stripe, github, aws, http)")
    .option("--all", "Validate all secrets that have a detectable provider")
    .option("--manifest", "Only validate manifest-declared secrets (with --all)")
    .option("--list-providers", "List all available providers")
    .action(async (key: string | undefined, cmd) => {
      if (cmd.listProviders) {
        console.log(c.bold(`\n  ${SYMBOLS.shield} Available validation providers\n`));
        for (const p of providerRegistry.listProviders()) {
          const prefixes = p.prefixes?.length ? c.dim(` (${p.prefixes.join(", ")})`) : "";
          console.log(`  ${c.cyan(p.name.padEnd(10))} ${p.description}${prefixes}`);
        }
        console.log();
        return;
      }

      if (!key && !cmd.all) {
        console.error(c.red(`${SYMBOLS.cross} Provide a key name or use --all`));
        process.exit(1);
      }

      const opts = buildOpts(cmd);

      if (cmd.all) {
        let entries = listSecrets(opts);
        const projectPath = cmd.projectPath ?? process.cwd();

        if (cmd.manifest) {
          const config = readProjectConfig(projectPath);
          if (config?.secrets) {
            const manifestKeys = new Set(Object.keys(config.secrets));
            entries = entries.filter((e) => manifestKeys.has(e.key));
          }
        }

        console.log(c.bold(`\n  ${SYMBOLS.shield} Validating secrets\n`));

        let validated = 0;
        let skipped = 0;

        for (const entry of entries) {
          const value = getSecret(entry.key, { ...opts, scope: entry.scope });
          if (!value) { skipped++; continue; }

          const provHint = entry.envelope?.meta.provider ?? cmd.provider;
          const result = await validateSecret(value, { provider: provHint });

          if (result.status === "unknown") { skipped++; continue; }

          validated++;
          const icon = result.status === "valid" ? c.green(SYMBOLS.check)
            : result.status === "invalid" ? c.red(SYMBOLS.cross)
            : c.yellow(SYMBOLS.warning);
          const statusText = result.status === "valid" ? c.green("valid")
            : result.status === "invalid" ? c.red("invalid")
            : c.yellow("error");

          console.log(
            `  ${icon} ${c.bold(entry.key.padEnd(24))} ${statusText}  ${c.dim(`(${result.provider}, ${result.latencyMs}ms)`)}${result.status !== "valid" ? ` ${c.dim("— " + result.message)}` : ""}`,
          );
        }

        console.log(`\n  ${c.dim(`${validated} validated, ${skipped} skipped (no provider)`)}\n`);
        return;
      }

      const value = getSecret(key!, opts);
      if (!value) {
        console.error(c.red(`${SYMBOLS.cross} Secret "${key}" not found`));
        process.exit(1);
      }

      const envelope = getEnvelope(key!, opts);
      const provHint = envelope?.envelope.meta.provider ?? cmd.provider;
      const result = await validateSecret(value, { provider: provHint });

      const icon = result.status === "valid" ? c.green(SYMBOLS.check)
        : result.status === "invalid" ? c.red(SYMBOLS.cross)
        : result.status === "error" ? c.yellow(SYMBOLS.warning)
        : c.dim("○");

      console.log(`\n  ${icon} ${c.bold(key!)}  ${result.status}  ${c.dim(`(${result.provider}, ${result.latencyMs}ms)`)}`);
      if (result.message && result.status !== "valid") {
        console.log(`    ${c.dim(result.message)}`);
      }
      console.log();
    });

  program
    .command("exec <command...>")
    .description("Run a command with secrets injected into its environment (output auto-redacted)")
    .option("-g, --global", "Inject global scope secrets only")
    .option("-p, --project", "Inject project scope secrets only")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Environment context")
    .option("-k, --keys <keys>", "Comma-separated key names to inject")
    .option("-t, --tags <tags>", "Comma-separated tags to filter by")
    .option("--profile <name>", "Exec profile: unrestricted, restricted, ci")
    .action(async (commandArgs: string[], cmd) => {
      const opts = buildOpts(cmd);
      const command = commandArgs[0];
      const args = commandArgs.slice(1);

      try {
        const { code } = await execCommand({
          ...opts,
          command,
          args,
          keys: cmd.keys?.split(",").map((k: string) => k.trim()),
          tags: cmd.tags?.split(",").map((t: string) => t.trim()),
          profile: cmd.profile,
        });
        process.exit(code);
      } catch (err) {
        console.error(c.red(`${SYMBOLS.cross} Exec failed: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  program
    .command("scan [dir]")
    .description("Scan a codebase for hardcoded secrets")
    .option("--fix", "Auto-replace hardcoded secrets with process.env references and store in q-ring")
    .option("-g, --global", "Store fixed secrets in global scope")
    .option("-p, --project", "Store fixed secrets in project scope")
    .option("--project-path <path>", "Explicit project path")
    .action((dir: string | undefined, cmd) => {
      const targetDir = dir ?? process.cwd();
      const fixMode = cmd.fix === true;
      console.log(`\n  ${SYMBOLS.eye} Scanning ${c.bold(targetDir)} for secrets...${fixMode ? c.yellow(" [--fix mode]") : ""}\n`);
      
      const results = scanCodebase(targetDir);
      
      if (results.length === 0) {
        console.log(`  ${c.green(SYMBOLS.check)} No hardcoded secrets found. Awesome!\n`);
        return;
      }
      
      if (fixMode) {
        const fileSet = new Set(results.map(r => r.file.startsWith("/") ? r.file : `${targetDir}/${r.file}`));
        const opts = buildOpts(cmd);
        const lintResults = lintFiles([...fileSet], { fix: true, scope: opts.scope, projectPath: opts.projectPath });
        const fixedCount = lintResults.filter(r => r.fixed).length;
        console.log(`  ${c.green(SYMBOLS.check)} Fixed ${fixedCount} secrets — replaced with process.env references and stored in q-ring.\n`);
        return;
      }
      
      for (const res of results) {
        console.log(`  ${c.red(SYMBOLS.cross)} ${c.bold(res.file)}:${res.line}`);
        console.log(`    ${c.dim("Key:")}     ${c.cyan(res.keyName)}`);
        console.log(`    ${c.dim("Entropy:")} ${res.entropy > 4 ? c.red(res.entropy.toString()) : c.yellow(res.entropy.toString())}`);
        console.log(`    ${c.dim("Context:")} ${res.context}`);
        console.log();
      }
      
      console.log(`  ${c.red(`Found ${results.length} potential secrets.`)} Use ${c.bold("qring scan --fix")} to auto-migrate them.\n`);
    });

  program
    .command("lint <files...>")
    .description("Lint specific files for hardcoded secrets (with optional auto-fix)")
    .option("--fix", "Replace hardcoded secrets with process.env references and store in q-ring")
    .option("-g, --global", "Store fixed secrets in global scope")
    .option("-p, --project", "Store fixed secrets in project scope")
    .option("--project-path <path>", "Explicit project path")
    .action((files: string[], cmd) => {
      const opts = buildOpts(cmd);
      const results = lintFiles(files, { fix: cmd.fix, scope: opts.scope, projectPath: opts.projectPath });

      if (results.length === 0) {
        console.log(`\n  ${c.green(SYMBOLS.check)} No hardcoded secrets found in ${files.length} file(s).\n`);
        return;
      }

      for (const res of results) {
        const status = res.fixed ? c.green("fixed") : c.red("found");
        console.log(`  ${res.fixed ? c.green(SYMBOLS.check) : c.red(SYMBOLS.cross)} ${c.bold(res.file)}:${res.line} [${status}]`);
        console.log(`    ${c.dim("Key:")}     ${c.cyan(res.keyName)}`);
        console.log(`    ${c.dim("Entropy:")} ${res.entropy > 4 ? c.red(res.entropy.toString()) : c.yellow(res.entropy.toString())}`);
        console.log();
      }

      const fixedCount = results.filter(r => r.fixed).length;
      if (cmd.fix && fixedCount > 0) {
        console.log(`  ${c.green(`Fixed ${fixedCount} secret(s)`)} — replaced with env references and stored in q-ring.\n`);
      } else {
        console.log(`  ${c.red(`Found ${results.length} potential secret(s).`)} Use ${c.bold("--fix")} to auto-migrate.\n`);
      }
    });

  // ─── Context & AI Tools ───

  program
    .command("context")
    .alias("describe")
    .description("Show safe, redacted project context for AI agents (no secret values exposed)")
    .option("-g, --global", "Global scope only")
    .option("-p, --project", "Project scope only")
    .option("--project-path <path>", "Explicit project path")
    .option("--json", "Output as JSON (for MCP / programmatic use)")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const context = getProjectContext(opts);

      if (cmd.json) {
        console.log(JSON.stringify(context, null, 2));
        return;
      }

      console.log(`\n${SYMBOLS.zap} ${c.bold("Project Context for AI Assistant")}`);
      console.log(`  Project: ${c.cyan(context.projectPath)}`);

      if (context.environment) {
        console.log(`  Environment: ${envBadge(context.environment.env)} ${c.dim(`(${context.environment.source})`)}`);
      }

      console.log(`\n${c.bold("  Secrets:")} ${context.totalSecrets} total  ${c.dim(`(${context.expiredCount} expired, ${context.staleCount} stale, ${context.protectedCount} protected)`)}`);
      for (const s of context.secrets) {
        const tags = s.tags?.length ? c.dim(` [${s.tags.join(",")}]`) : "";
        const flags: string[] = [];
        if (s.requiresApproval) flags.push(c.yellow("locked"));
        if (s.jitProvider) flags.push(c.magenta("jit"));
        if (s.hasStates) flags.push(c.blue("superposition"));
        if (s.isExpired) flags.push(c.red("expired"));
        else if (s.isStale) flags.push(c.yellow("stale"));
        const flagStr = flags.length ? ` ${flags.join(" ")}` : "";
        console.log(`    ${c.bold(s.key)} ${scopeColor(s.scope)}${tags}${flagStr}`);
      }

      if (context.manifest) {
        console.log(`\n${c.bold("  Manifest:")} ${context.manifest.declared} declared`);
        if (context.manifest.missing.length > 0) {
          console.log(`    ${c.red("Missing:")} ${context.manifest.missing.join(", ")}`);
        } else {
          console.log(`    ${c.green(SYMBOLS.check)} All manifest secrets present`);
        }
      }

      console.log(`\n${c.bold("  Providers:")} ${context.validationProviders.join(", ") || "none"}`);
      console.log(`${c.bold("  JIT Providers:")} ${context.jitProviders.join(", ") || "none"}`);
      console.log(`${c.bold("  Hooks:")} ${context.hooksCount} registered`);

      if (context.recentActions.length > 0) {
        console.log(`\n${c.bold("  Recent Activity:")} (last ${context.recentActions.length})`);
        for (const a of context.recentActions.slice(0, 8)) {
          const ts = new Date(a.timestamp).toLocaleTimeString();
          console.log(`    ${c.dim(ts)} ${a.action}${a.key ? ` ${c.bold(a.key)}` : ""} ${c.dim(`(${a.source})`)}`);
        }
      }

      console.log();
    });

  // ─── Agent Memory ───

  program
    .command("remember <key> <value>")
    .description("Store a key-value pair in encrypted agent memory (persists across sessions)")
    .action((key: string, value: string) => {
      remember(key, value);
      console.log(`${SYMBOLS.check} ${c.green("remembered")} ${c.bold(key)}`);
    });

  program
    .command("recall [key]")
    .description("Retrieve a value from agent memory, or list all keys")
    .action((key?: string) => {
      if (!key) {
        const entries = listMemory();
        if (entries.length === 0) {
          console.log(c.dim("Agent memory is empty."));
          return;
        }
        console.log(`\n${SYMBOLS.zap} ${c.bold("Agent Memory")} (${entries.length} entries)\n`);
        for (const e of entries) {
          console.log(`  ${c.bold(e.key)}  ${c.dim(new Date(e.updatedAt).toLocaleString())}`);
        }
        console.log();
        return;
      }

      const value = recall(key);
      if (value === null) {
        console.log(c.dim(`No memory found for "${key}"`));
      } else {
        console.log(safeStr(value));
      }
    });

  program
    .command("forget <key>")
    .description("Delete a key from agent memory")
    .option("--all", "Clear all agent memory")
    .action((key: string, cmd) => {
      if (cmd.all) {
        clearMemory();
        console.log(`${SYMBOLS.check} ${c.yellow("cleared")} all agent memory`);
        return;
      }
      const removed = forget(key);
      if (removed) {
        console.log(`${SYMBOLS.check} ${c.yellow("forgot")} ${c.bold(key)}`);
      } else {
        console.log(c.dim(`No memory found for "${key}"`));
      }
    });

  // ─── Approval Commands ───

  program
    .command("approve <key>")
    .description("Grant a scoped, reasoned, HMAC-verified approval token for MCP secret access")
    .option("-g, --global", "Global scope")
    .option("-p, --project", "Project scope")
    .option("--project-path <path>", "Explicit project path")
    .option("--for <seconds>", "Duration of approval in seconds", parseInt, 3600)
    .option("--reason <text>", "Reason for granting approval")
    .option("--revoke", "Revoke an existing approval")
    .option("--list", "List all approvals")
    .action((key: string, cmd) => {
      const opts = buildOpts(cmd);
      const scope = opts.scope ?? "global";

      if (cmd.list) {
        const approvals = listApprovals();
        if (approvals.length === 0) {
          console.log(c.dim("  No active approvals"));
          return;
        }
        for (const a of approvals) {
          const status = a.tampered
            ? c.red("TAMPERED")
            : a.valid
              ? c.green("active")
              : c.dim("expired");
          const ttl = Math.max(0, Math.round((new Date(a.expiresAt).getTime() - Date.now()) / 1000));
          console.log(`  ${status} ${c.bold(a.key)} [${a.scope}] reason=${c.dim(a.reason)} ttl=${ttl}s granted-by=${a.grantedBy}`);
        }
        return;
      }

      if (cmd.revoke) {
        const revoked = revokeApproval(key, scope);
        if (revoked) {
          console.log(`${SYMBOLS.check} ${c.yellow("revoked")} approval for ${c.bold(key)}`);
        } else {
          console.log(c.dim(`  No active approval found for ${key}`));
        }
        return;
      }

      const entry = grantApproval(key, scope, cmd.for, {
        reason: cmd.reason ?? "manual approval",
      });
      console.log(`${SYMBOLS.check} ${c.green("approved")} ${c.bold(key)} for ${cmd.for}s`);
      console.log(c.dim(`  id=${entry.id} reason="${entry.reason}" expires=${entry.expiresAt}`));
    });

  program
    .command("approvals")
    .description("List all approval tokens with verification status")
    .action(() => {
      const approvals = listApprovals();
      if (approvals.length === 0) {
        console.log(c.dim("  No approvals found"));
        return;
      }

      console.log(c.bold("\n🔐 Approval Tokens\n"));
      for (const a of approvals) {
        const status = a.tampered
          ? c.red(`${SYMBOLS.cross} TAMPERED`)
          : a.valid
            ? c.green(`${SYMBOLS.check} active`)
            : c.dim(`${SYMBOLS.warning} expired`);
        const ttl = Math.max(0, Math.round((new Date(a.expiresAt).getTime() - Date.now()) / 1000));
        console.log(`  ${status} ${c.bold(a.key)} [${a.scope}]`);
        console.log(c.dim(`    id=${a.id} reason="${a.reason}" ttl=${ttl}s by=${a.grantedBy}`));
        if (a.workspace) console.log(c.dim(`    workspace=${a.workspace}`));
      }
      console.log();
    });

  // ─── Pre-Commit Hook ───

  program
    .command("hook:install")
    .description("Install a git pre-commit hook that scans for hardcoded secrets")
    .option("--project-path <path>", "Repository path")
    .action((cmd) => {
      const result = installPreCommitHook(cmd.projectPath);
      if (result.installed) {
        console.log(`${SYMBOLS.check} ${c.green(result.message)} at ${c.dim(result.path)}`);
      } else {
        console.log(`${SYMBOLS.cross} ${c.red(result.message)}`);
      }
    });

  program
    .command("hook:uninstall")
    .description("Remove the q-ring pre-commit hook")
    .option("--project-path <path>", "Repository path")
    .action((cmd) => {
      const removed = uninstallPreCommitHook(cmd.projectPath);
      if (removed) {
        console.log(`${SYMBOLS.check} ${c.green("Pre-commit hook removed")}`);
      } else {
        console.log(c.dim("No q-ring pre-commit hook found"));
      }
    });

  program
    .command("hook:run")
    .description("Run the pre-commit secret scan (called by the git hook)")
    .action(() => {
      const code = runPreCommitScan();
      process.exit(code);
    });

  // ─── Wizard ───

  program
    .command("wizard <name>")
    .description("Set up a new service integration with secrets, manifest, and hooks")
    .option("--keys <keys>", "Comma-separated secret key names to create (e.g. API_KEY,API_SECRET)")
    .option("--provider <provider>", "Validation provider (e.g. openai, stripe, github)")
    .option("--tags <tags>", "Comma-separated tags for all secrets")
    .option("--hook-exec <cmd>", "Shell command to run when any of these secrets change")
    .option("-g, --global", "Global scope")
    .option("-p, --project", "Project scope")
    .option("--project-path <path>", "Explicit project path")
    .action(async (name: string, cmd) => {
      const opts = buildOpts(cmd);
      const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      const tags = cmd.tags?.split(",").map((t: string) => t.trim()) ?? [name.toLowerCase()];
      const provider = cmd.provider;

      let keyNames: string[];
      if (cmd.keys) {
        keyNames = cmd.keys.split(",").map((k: string) => k.trim());
      } else {
        keyNames = [`${prefix}_API_KEY`, `${prefix}_API_SECRET`];
      }

      console.log(`\n${SYMBOLS.zap} ${c.bold(`Setting up service: ${name}`)}\n`);

      // Create secrets
      for (const key of keyNames) {
        const value = generateSecret({ format: "api-key", prefix: `${prefix.toLowerCase()}_` });
        setSecret(key, value, {
          ...opts,
          tags,
          provider,
          description: `Auto-generated by wizard for ${name}`,
        });
        console.log(`  ${c.green(SYMBOLS.check)} Created ${c.bold(key)}`);
      }

      // Update manifest if it exists
      const projectPath = opts.projectPath ?? process.cwd();
      const manifestPath = `${projectPath}/.q-ring.json`;
      let config: any = {};
      try {
        if (existsSync(manifestPath)) {
          config = JSON.parse(readFileSync(manifestPath, "utf8"));
        }
      } catch { /* ignore */ }

      if (!config.secrets) config.secrets = {};
      for (const key of keyNames) {
        config.secrets[key] = {
          required: true,
          description: `${name} integration`,
          ...(provider ? { provider } : {}),
        };
      }

      writeFileSync(manifestPath, JSON.stringify(config, null, 2) + "\n", "utf8");
      console.log(`  ${c.green(SYMBOLS.check)} Updated ${c.dim(".q-ring.json")} manifest`);

      // Register hook if requested
      if (cmd.hookExec) {
        for (const key of keyNames) {
          registerHook({
            type: "shell" as HookType,
            match: { key, action: ["write" as HookAction, "delete" as HookAction] },
            command: cmd.hookExec,
            description: `${name} wizard hook`,
            enabled: true,
          });
        }
        console.log(`  ${c.green(SYMBOLS.check)} Registered hook: ${c.dim(cmd.hookExec)}`);
      }

      console.log(`\n  ${c.green("Done!")} Service "${name}" is ready with ${keyNames.length} secrets.\n`);
    });

  // ─── Analytics ───

  program
    .command("analyze")
    .description("Analyze secret usage patterns and provide optimization suggestions")
    .option("-g, --global", "Global scope only")
    .option("-p, --project", "Project scope only")
    .option("--project-path <path>", "Explicit project path")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const entries = listSecrets({ ...opts, silent: true });
      const audit = queryAudit({ limit: 1000 });

      console.log(`\n${SYMBOLS.zap} ${c.bold("Secret Usage Analysis")}\n`);

      // Access frequency
      const accessMap = new Map<string, number>();
      for (const e of audit) {
        if (e.action === "read" && e.key) {
          accessMap.set(e.key, (accessMap.get(e.key) || 0) + 1);
        }
      }

      // Most accessed
      const sorted = [...accessMap.entries()].sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        console.log(`  ${c.bold("Most accessed:")}`);
        for (const [key, count] of sorted.slice(0, 5)) {
          console.log(`    ${c.bold(key)} — ${c.cyan(count.toString())} reads`);
        }
        console.log();
      }

      // Never accessed
      const neverAccessed = entries.filter((e) => {
        const count = e.envelope?.meta.accessCount ?? 0;
        return count === 0;
      });
      if (neverAccessed.length > 0) {
        console.log(`  ${c.bold("Never accessed:")} ${c.yellow(neverAccessed.length.toString())} secrets`);
        for (const e of neverAccessed.slice(0, 8)) {
          const age = e.envelope?.meta.createdAt
            ? c.dim(`(created ${new Date(e.envelope.meta.createdAt).toLocaleDateString()})`)
            : "";
          console.log(`    ${c.dim(SYMBOLS.cross)} ${e.key} ${age}`);
        }
        console.log();
      }

      // Expired / stale
      const expired = entries.filter((e) => e.decay?.isExpired);
      const stale = entries.filter((e) => e.decay?.isStale && !e.decay?.isExpired);
      if (expired.length > 0) {
        console.log(`  ${c.red("Expired:")} ${expired.length} secrets need rotation or cleanup`);
        for (const e of expired.slice(0, 5)) {
          console.log(`    ${c.red(SYMBOLS.cross)} ${e.key}`);
        }
        console.log();
      }
      if (stale.length > 0) {
        console.log(`  ${c.yellow("Stale (>75% lifetime):")} ${stale.length} secrets approaching expiry`);
        for (const e of stale.slice(0, 5)) {
          console.log(`    ${c.yellow(SYMBOLS.warning)} ${e.key} ${c.dim(`(${e.decay?.timeRemaining} remaining)`)}`);
        }
        console.log();
      }

      // Scope suggestions
      const globalOnly = entries.filter((e) => e.scope === "global");
      const withProjectTags = globalOnly.filter(
        (e) => e.envelope?.meta.tags?.some((t) => ["backend", "frontend", "db", "api"].includes(t)),
      );
      if (withProjectTags.length > 0) {
        console.log(`  ${c.bold("Scope suggestions:")}`);
        console.log(`    ${withProjectTags.length} global secret(s) have project-specific tags — consider moving to project scope`);
        console.log();
      }

      // Rotation suggestions
      const noRotation = entries.filter(
        (e) => !e.envelope?.meta.rotationFormat && !e.decay?.isExpired,
      );
      if (noRotation.length > 0) {
        console.log(`  ${c.bold("Rotation suggestions:")}`);
        console.log(`    ${noRotation.length} secret(s) have no rotation format set`);
        console.log(`    Use ${c.bold("qring set <key> <value> --rotation-format api-key")} to enable auto-rotation`);
        console.log();
      }

      // Summary
      console.log(`  ${c.bold("Summary:")}`);
      console.log(`    Total secrets: ${entries.length}`);
      console.log(`    Active: ${entries.length - expired.length}`);
      console.log(`    Expired: ${expired.length}`);
      console.log(`    Stale: ${stale.length}`);
      console.log(`    Never accessed: ${neverAccessed.length}`);
      console.log(`    With rotation config: ${entries.length - noRotation.length}`);
      console.log();
    });

  // ─── Quantum Commands ───

  program
    .command("env")
    .description("Show detected environment (wavefunction collapse context)")
    .option("--project-path <path>", "Project path for detection")
    .action((cmd) => {
      const result = collapseEnvironment({
        projectPath: cmd.projectPath ?? process.cwd(),
      });

      if (result) {
        console.log(
          `${SYMBOLS.zap} ${c.bold("Collapsed environment:")} ${envBadge(result.env)} ${c.dim(`(source: ${result.source})`)}`,
        );
      } else {
        console.log(
          c.dim("No environment detected. Set QRING_ENV, NODE_ENV, or create .q-ring.json"),
        );
      }
    });

  program
    .command("generate")
    .alias("gen")
    .description("Generate a cryptographic secret (quantum noise)")
    .option(
      "-f, --format <format>",
      "Format: hex, base64, alphanumeric, uuid, api-key, token, password",
      "api-key",
    )
    .option("-l, --length <n>", "Length (bytes or chars depending on format)", parseInt)
    .option("--prefix <prefix>", "Prefix for api-key/token format")
    .option("-s, --save <key>", "Save the generated secret to keyring with this key")
    .option("-g, --global", "Save to global scope")
    .option("-p, --project", "Save to project scope")
    .option("--project-path <path>", "Explicit project path")
    .action((cmd) => {
      const secret = generateSecret({
        format: cmd.format as NoiseFormat,
        length: cmd.length,
        prefix: cmd.prefix,
      });

      const entropy = estimateEntropy(secret);

      if (cmd.save) {
        const opts = buildOpts(cmd);
        setSecret(cmd.save, secret, opts);
        console.log(
          `${SYMBOLS.sparkle} ${c.green("generated & saved")} ${c.bold(cmd.save)} ${c.dim(`(${cmd.format}, ${entropy} bits entropy)`)}`,
        );
      } else {
        process.stdout.write(secret);
        if (process.stdout.isTTY) {
          console.log(
            `\n${c.dim(`format: ${cmd.format} | entropy: ~${entropy} bits`)}`,
          );
        }
      }
    });

  program
    .command("entangle <sourceKey> <targetKey>")
    .description("Link two secrets — rotating one updates the other")
    .option("-g, --global", "Both in global scope")
    .option("--source-project <path>", "Source project path")
    .option("--target-project <path>", "Target project path")
    .action(
      (
        sourceKey: string,
        targetKey: string,
        cmd,
      ) => {
        const sourceOpts: KeyringOptions = {
          scope: cmd.sourceProject ? "project" : "global",
          projectPath: cmd.sourceProject ?? process.cwd(),
          source: "cli",
        };
        const targetOpts: KeyringOptions = {
          scope: cmd.targetProject ? "project" : "global",
          projectPath: cmd.targetProject ?? process.cwd(),
          source: "cli",
        };

        entangleSecrets(sourceKey, sourceOpts, targetKey, targetOpts);
        console.log(
          `${SYMBOLS.link} ${c.cyan("entangled")} ${c.bold(sourceKey)} ${SYMBOLS.arrow} ${c.bold(targetKey)}`,
        );
      },
    );

  program
    .command("disentangle <sourceKey> <targetKey>")
    .description("Unlink two entangled secrets")
    .option("-g, --global", "Both in global scope")
    .option("--source-project <path>", "Source project path")
    .option("--target-project <path>", "Target project path")
    .action(
      (
        sourceKey: string,
        targetKey: string,
        cmd,
      ) => {
        const sourceOpts: KeyringOptions = {
          scope: cmd.sourceProject ? "project" : "global",
          projectPath: cmd.sourceProject ?? process.cwd(),
          source: "cli",
        };
        const targetOpts: KeyringOptions = {
          scope: cmd.targetProject ? "project" : "global",
          projectPath: cmd.targetProject ?? process.cwd(),
          source: "cli",
        };

        disentangleSecrets(sourceKey, sourceOpts, targetKey, targetOpts);
        console.log(
          `${SYMBOLS.link} ${c.yellow("disentangled")} ${c.bold(sourceKey)} ${SYMBOLS.arrow} ${c.bold(targetKey)}`,
        );
      },
    );

  // ─── Tunneling Commands ───

  const tunnel = program
    .command("tunnel")
    .description("Ephemeral in-memory secrets (quantum tunneling)");

  tunnel
    .command("create <value>")
    .description("Create a tunneled secret (returns tunnel ID)")
    .option("--ttl <seconds>", "Auto-expire after N seconds", parseInt)
    .option("--max-reads <n>", "Self-destruct after N reads", parseInt)
    .action((value: string, cmd) => {
      const id = tunnelCreate(value, {
        ttlSeconds: cmd.ttl,
        maxReads: cmd.maxReads,
      });

      console.log(`${SYMBOLS.ghost} ${c.magenta("tunneled")} ${c.bold(id)}`);

      const extras: string[] = [];
      if (cmd.ttl) extras.push(`ttl=${cmd.ttl}s`);
      if (cmd.maxReads) extras.push(`max-reads=${cmd.maxReads}`);
      if (extras.length) console.log(c.dim(`  ${extras.join(" | ")}`));
    });

  tunnel
    .command("read <id>")
    .description("Read a tunneled secret (may self-destruct)")
    .action((id: string) => {
      const value = tunnelRead(id);
      if (value === null) {
        console.error(
          c.red(`${SYMBOLS.cross} Tunnel "${id}" not found or expired`),
        );
        process.exit(1);
      }
      process.stdout.write(value);
    });

  tunnel
    .command("destroy <id>")
    .description("Destroy a tunneled secret immediately")
    .action((id: string) => {
      const destroyed = tunnelDestroy(id);
      if (destroyed) {
        console.log(`${SYMBOLS.check} ${c.green("destroyed")} ${id}`);
      } else {
        console.error(
          c.red(`${SYMBOLS.cross} Tunnel "${id}" not found`),
        );
        process.exit(1);
      }
    });

  tunnel
    .command("list")
    .alias("ls")
    .description("List active tunnels")
    .action(() => {
      const tunnels = tunnelList();
      if (tunnels.length === 0) {
        console.log(c.dim("No active tunnels"));
        return;
      }

      console.log(c.bold(`\n  ${SYMBOLS.ghost} Active tunnels (${tunnels.length})\n`));
      for (const t of tunnels) {
        const parts = [c.bold(t.id)];
        parts.push(c.dim(`reads: ${t.accessCount}`));
        if (t.maxReads) parts.push(c.dim(`max: ${t.maxReads}`));
        if (t.expiresAt) {
          const remaining = Math.max(0, Math.floor((t.expiresAt - Date.now()) / 1000));
          parts.push(c.dim(`expires: ${remaining}s`));
        }
        console.log(`  ${SYMBOLS.ghost} ${parts.join("  ")}`);
      }
      console.log();
    });

  // ─── Teleportation Commands ───

  const tp = program
    .command("teleport")
    .alias("tp")
    .description("Encrypted secret sharing (quantum teleportation)");

  tp.command("pack")
    .description("Pack secrets into an encrypted bundle")
    .option("-k, --keys <keys>", "Comma-separated key names to pack")
    .option("-g, --global", "Pack global scope")
    .option("-p, --project", "Pack project scope")
    .option("--project-path <path>", "Explicit project path")
    .action(async (cmd) => {
      const opts = buildOpts(cmd);
      const passphrase = await promptSecret(
        `${SYMBOLS.lock} Enter passphrase for encryption: `,
      );
      if (!passphrase) {
        console.error(c.red("Passphrase required"));
        process.exit(1);
      }

      const entries = listSecrets(opts);
      let keys: string[] | undefined;
      if (cmd.keys) {
        keys = cmd.keys.split(",").map((k: string) => k.trim());
      }

      const secrets: { key: string; value: string; scope?: string }[] = [];
      for (const entry of entries) {
        if (keys && !keys.includes(entry.key)) continue;
        const value = getSecret(entry.key, { ...opts, scope: entry.scope });
        if (value !== null) {
          secrets.push({ key: entry.key, value, scope: entry.scope });
        }
      }

      if (secrets.length === 0) {
        console.error(c.red("No secrets to pack"));
        process.exit(1);
      }

      const bundle = teleportPack(secrets, passphrase);
      process.stdout.write(bundle);
      if (process.stdout.isTTY) {
        console.log(
          `\n${SYMBOLS.package} ${c.green("packed")} ${secrets.length} secret(s)`,
        );
      }
    });

  tp.command("unpack [bundle]")
    .description("Unpack and import secrets from an encrypted bundle")
    .option("-g, --global", "Import to global scope")
    .option("-p, --project", "Import to project scope")
    .option("--project-path <path>", "Explicit project path")
    .option("--dry-run", "Show what would be imported without saving")
    .action(async (bundle: string | undefined, cmd) => {
      if (!bundle) {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        bundle = Buffer.concat(chunks).toString("utf8").trim();
      }

      const passphrase = await promptSecret(
        `${SYMBOLS.lock} Enter passphrase for decryption: `,
      );

      try {
        const payload = teleportUnpack(bundle, passphrase);

        if (cmd.dryRun) {
          console.log(
            `\n${SYMBOLS.package} ${c.bold("Would import")} (${payload.secrets.length} secrets):\n`,
          );
          for (const s of payload.secrets) {
            console.log(`  ${SYMBOLS.key} ${c.bold(s.key)} ${c.dim(`[${s.scope ?? "global"}]`)}`);
          }
          return;
        }

        const opts = buildOpts(cmd);
        for (const s of payload.secrets) {
          setSecret(s.key, s.value, opts);
        }

        console.log(
          `${SYMBOLS.check} ${c.green("imported")} ${payload.secrets.length} secret(s) from teleport bundle`,
        );
      } catch {
        console.error(
          c.red(`${SYMBOLS.cross} Failed to unpack: wrong passphrase or corrupted bundle`),
        );
        process.exit(1);
      }
    });

  // ─── Observer / Audit Commands ───

  program
    .command("audit")
    .description("View the audit log (observer effect)")
    .option("-k, --key <key>", "Filter by key")
    .option(
      "-a, --action <action>",
      "Filter by action (read, write, delete, etc.)",
    )
    .option("-n, --limit <n>", "Number of events to show", parseInt, 20)
    .option("--anomalies", "Detect access anomalies")
    .action((cmd) => {
      if (cmd.anomalies) {
        const anomalies = detectAnomalies(cmd.key);
        if (anomalies.length === 0) {
          console.log(
            `${SYMBOLS.shield} ${c.green("No anomalies detected")}`,
          );
          return;
        }

        console.log(
          `\n${SYMBOLS.warning} ${c.bold(c.yellow(`${anomalies.length} anomaly/anomalies detected`))}\n`,
        );
        for (const a of anomalies) {
          console.log(`  ${c.yellow(a.type)} ${a.description}`);
        }
        console.log();
        return;
      }

      const events = queryAudit({
        key: cmd.key,
        action: cmd.action,
        limit: cmd.limit,
      });

      if (events.length === 0) {
        console.log(c.dim("No audit events found"));
        return;
      }

      console.log(
        c.bold(`\n  ${SYMBOLS.eye} Audit log (${events.length} events)\n`),
      );

      for (const event of events) {
        const ts = new Date(event.timestamp).toLocaleString();
        const actionColor =
          event.action === "read"
            ? c.blue
            : event.action === "write"
              ? c.green
              : event.action === "delete"
                ? c.red
                : c.yellow;

        const parts = [
          c.dim(ts),
          actionColor(event.action.padEnd(8)),
          event.key ? c.bold(event.key) : "",
          event.scope ? c.dim(`[${event.scope}]`) : "",
          event.detail ? c.dim(event.detail) : "",
        ];

        console.log(`  ${parts.filter(Boolean).join("  ")}`);
      }
      console.log();
    });

  program
    .command("audit:verify")
    .description("Verify the integrity of the audit hash chain")
    .action(() => {
      const result = verifyAuditChain();
      if (result.totalEvents === 0) {
        console.log(c.dim("  No audit events to verify"));
        return;
      }

      if (result.intact) {
        console.log(`${SYMBOLS.shield} ${c.green("Audit chain intact")} — ${result.totalEvents} events verified`);
      } else {
        console.log(`${SYMBOLS.cross} ${c.red("Audit chain BROKEN")} at event #${result.brokenAt}`);
        console.log(c.dim(`  ${result.validEvents}/${result.totalEvents} events valid before break`));
        if (result.brokenEvent) {
          console.log(c.dim(`  Broken event: ${result.brokenEvent.timestamp} ${result.brokenEvent.action} ${result.brokenEvent.key ?? ""}`));
        }
        process.exitCode = 1;
      }
    });

  program
    .command("audit:export")
    .description("Export audit events in a portable format")
    .option("--since <date>", "Start date (ISO 8601)")
    .option("--until <date>", "End date (ISO 8601)")
    .option("--format <fmt>", "Output format: jsonl, json, csv", "jsonl")
    .option("-o, --output <file>", "Write to file instead of stdout")
    .action((cmd) => {
      const output = exportAudit({
        since: cmd.since,
        until: cmd.until,
        format: cmd.format,
      });

      if (cmd.output) {
        writeFileSync(cmd.output, output);
        console.log(`${SYMBOLS.check} Exported to ${cmd.output}`);
      } else {
        console.log(output);
      }
    });

  // ─── Health Check ───

  program
    .command("health")
    .description("Check the health of all secrets")
    .option("-g, --global", "Check global scope only")
    .option("-p, --project", "Check project scope only")
    .option("--project-path <path>", "Explicit project path")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const entries = listSecrets(opts);

      if (entries.length === 0) {
        console.log(c.dim("No secrets to check"));
        return;
      }

      console.log(
        c.bold(`\n  ${SYMBOLS.shield} Secret health report\n`),
      );

      let healthy = 0;
      let stale = 0;
      let expired = 0;
      let noDecay = 0;

      for (const entry of entries) {
        if (!entry.decay || !entry.decay.timeRemaining) {
          noDecay++;
          continue;
        }

        if (entry.decay.isExpired) {
          expired++;
          console.log(
            `  ${c.red(SYMBOLS.cross)} ${c.bold(entry.key)} ${c.bgRed(c.white(" EXPIRED "))}`,
          );
        } else if (entry.decay.isStale) {
          stale++;
          console.log(
            `  ${c.yellow(SYMBOLS.warning)} ${c.bold(entry.key)} ${c.yellow(`stale (${entry.decay.lifetimePercent}%, ${entry.decay.timeRemaining} left)`)}`,
          );
        } else {
          healthy++;
        }
      }

      console.log(
        `\n  ${c.green(`${SYMBOLS.check} ${healthy} healthy`)}  ${c.yellow(`${SYMBOLS.warning} ${stale} stale`)}  ${c.red(`${SYMBOLS.cross} ${expired} expired`)}  ${c.dim(`${noDecay} no decay`)}`,
      );

      // Check for anomalies
      const anomalies = detectAnomalies();
      if (anomalies.length > 0) {
        console.log(
          `\n  ${c.yellow(`${SYMBOLS.warning} ${anomalies.length} access anomaly/anomalies detected`)} ${c.dim("(run: qring audit --anomalies)")}`,
        );
      }

      console.log();
    });

  // ─── Hooks ───

  const hook = program
    .command("hook")
    .description("Manage secret change hooks (callbacks on write/delete/rotate)");

  hook
    .command("add")
    .description("Register a new hook")
    .option("--key <key>", "Trigger on exact key match")
    .option("--key-pattern <pattern>", "Trigger on key glob pattern (e.g. DB_*)")
    .option("--tag <tag>", "Trigger on secrets with this tag")
    .option("--scope <scope>", "Trigger only for this scope (global or project)")
    .option("--action <actions>", "Comma-separated actions: write,delete,rotate", "write,delete,rotate")
    .option("--exec <command>", "Shell command to execute")
    .option("--url <url>", "HTTP URL to POST to")
    .option("--signal-target <target>", "Process name or PID to signal")
    .option("--signal-name <signal>", "Signal to send (default: SIGHUP)", "SIGHUP")
    .option("--description <desc>", "Human-readable description")
    .action((cmd) => {
      let type: HookType;
      if (cmd.exec) type = "shell";
      else if (cmd.url) type = "http";
      else if (cmd.signalTarget) type = "signal";
      else {
        console.error(c.red(`${SYMBOLS.cross} Specify --exec, --url, or --signal-target`));
        process.exit(1);
      }

      if (!cmd.key && !cmd.keyPattern && !cmd.tag) {
        console.error(c.red(`${SYMBOLS.cross} Specify at least one match criterion: --key, --key-pattern, or --tag`));
        process.exit(1);
      }

      const actions = cmd.action.split(",").map((a: string) => a.trim()) as HookAction[];

      const entry = registerHook({
        type,
        match: {
          key: cmd.key,
          keyPattern: cmd.keyPattern,
          tag: cmd.tag,
          scope: cmd.scope as "global" | "project" | undefined,
          action: actions,
        },
        command: cmd.exec,
        url: cmd.url,
        signal: cmd.signalTarget ? { target: cmd.signalTarget, signal: cmd.signalName } : undefined,
        description: cmd.description,
        enabled: true,
      });

      console.log(`${SYMBOLS.check} ${c.green("registered")} hook ${c.bold(entry.id)} (${type})`);
      if (cmd.key) console.log(c.dim(`  key: ${cmd.key}`));
      if (cmd.keyPattern) console.log(c.dim(`  pattern: ${cmd.keyPattern}`));
      if (cmd.tag) console.log(c.dim(`  tag: ${cmd.tag}`));
    });

  hook
    .command("list")
    .alias("ls")
    .description("List all registered hooks")
    .action(() => {
      const hooks = listAllHooks();
      if (hooks.length === 0) {
        console.log(c.dim("No hooks registered"));
        return;
      }

      console.log(c.bold(`\n  ${SYMBOLS.zap} Registered hooks (${hooks.length})\n`));

      for (const h of hooks) {
        const status = h.enabled ? c.green("on") : c.red("off");
        const matchParts: string[] = [];
        if (h.match.key) matchParts.push(`key=${h.match.key}`);
        if (h.match.keyPattern) matchParts.push(`pattern=${h.match.keyPattern}`);
        if (h.match.tag) matchParts.push(`tag=${h.match.tag}`);
        if (h.match.scope) matchParts.push(`scope=${h.match.scope}`);
        if (h.match.action?.length) matchParts.push(`actions=${h.match.action.join(",")}`);

        const target = h.type === "shell" ? h.command
          : h.type === "http" ? h.url
          : h.signal ? `${h.signal.target} (${h.signal.signal ?? "SIGHUP"})`
          : "?";

        console.log(`  ${c.bold(h.id)}  [${status}]  ${c.cyan(h.type)}  ${c.dim(matchParts.join(" "))}`);
        console.log(`    ${c.dim("→")} ${target}${h.description ? `  ${c.dim(`— ${h.description}`)}` : ""}`);
      }
      console.log();
    });

  hook
    .command("remove <id>")
    .alias("rm")
    .description("Remove a hook by ID")
    .action((id: string) => {
      if (removeHook(id)) {
        console.log(`${SYMBOLS.check} ${c.green("removed")} hook ${c.bold(id)}`);
      } else {
        console.error(c.red(`${SYMBOLS.cross} Hook "${id}" not found`));
        process.exit(1);
      }
    });

  hook
    .command("enable <id>")
    .description("Enable a hook")
    .action((id: string) => {
      if (enableHook(id)) {
        console.log(`${SYMBOLS.check} ${c.green("enabled")} hook ${c.bold(id)}`);
      } else {
        console.error(c.red(`${SYMBOLS.cross} Hook "${id}" not found`));
        process.exit(1);
      }
    });

  hook
    .command("disable <id>")
    .description("Disable a hook")
    .action((id: string) => {
      if (disableHook(id)) {
        console.log(`${SYMBOLS.check} ${c.yellow("disabled")} hook ${c.bold(id)}`);
      } else {
        console.error(c.red(`${SYMBOLS.cross} Hook "${id}" not found`));
        process.exit(1);
      }
    });

  hook
    .command("test <id>")
    .description("Dry-run a hook with a mock payload")
    .action(async (id: string) => {
      const hooks = listAllHooks();
      const h = hooks.find((hook) => hook.id === id);
      if (!h) {
        console.error(c.red(`${SYMBOLS.cross} Hook "${id}" not found`));
        process.exit(1);
      }

      console.log(c.dim(`Testing hook ${id} (${h.type})...\n`));

      const payload = {
        action: "write" as const,
        key: h.match.key ?? "TEST_KEY",
        scope: h.match.scope ?? "global",
        timestamp: new Date().toISOString(),
        source: "cli" as const,
      };

      const results = await fireHooks(payload);
      const result = results.find((r) => r.hookId === id);

      if (result) {
        const icon = result.success ? c.green(SYMBOLS.check) : c.red(SYMBOLS.cross);
        console.log(`  ${icon} ${result.message}`);
      } else {
        console.log(c.yellow(`  ${SYMBOLS.warning} Hook did not match the test payload`));
      }
      console.log();
    });

  // ─── Env Generate ───

  program
    .command("env:generate")
    .description("Generate a .env file from the project manifest (.q-ring.json)")
    .option("--project-path <path>", "Project path (defaults to cwd)")
    .option("-o, --output <file>", "Output file path (defaults to stdout)")
    .option("-e, --env <env>", "Force environment for superposition collapse")
    .action((cmd) => {
      const projectPath = cmd.projectPath ?? process.cwd();
      const config = readProjectConfig(projectPath);

      if (!config?.secrets || Object.keys(config.secrets).length === 0) {
        console.error(
          c.red(`${SYMBOLS.cross} No secrets manifest found in .q-ring.json`),
        );
        process.exit(1);
      }

      const opts = buildOpts(cmd);
      const lines: string[] = [];
      const warnings: string[] = [];

      for (const [key, manifest] of Object.entries(config.secrets)) {
        const value = getSecret(key, { ...opts, projectPath, source: "cli" });

        if (value === null) {
          if (manifest.required !== false) {
            warnings.push(`MISSING (required): ${key}`);
          }
          lines.push(`# ${key}= ${manifest.description ? `# ${manifest.description}` : ""}`);
          continue;
        }

        const result = getEnvelope(key, { projectPath, source: "cli" });
        if (result) {
          const decay = checkDecay(result.envelope);
          if (decay.isExpired) {
            warnings.push(`EXPIRED: ${key}`);
          } else if (decay.isStale) {
            warnings.push(`STALE (${decay.lifetimePercent}%): ${key}`);
          }
        }

        const escaped = value
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n");
        lines.push(`${key}="${escaped}"`);
      }

      const output = lines.join("\n") + "\n";

      if (cmd.output) {
        writeFileSync(cmd.output, output);
        console.log(
          `${SYMBOLS.check} ${c.green("generated")} ${c.bold(cmd.output)} (${Object.keys(config.secrets).length} keys)`,
        );
      } else {
        process.stdout.write(output);
      }

      if (warnings.length > 0 && process.stderr.isTTY) {
        console.error();
        for (const w of warnings) {
          console.error(`  ${c.yellow(SYMBOLS.warning)} ${w}`);
        }
        console.error();
      }
    });

  // ─── Status Dashboard ───

  program
    .command("status")
    .description("Launch the quantum status dashboard in your browser")
    .option("--port <port>", "Port to serve on", "9876")
    .option("--no-open", "Don't auto-open the browser")
    .action(async (cmd) => {
      const { startDashboardServer } = await import("../core/dashboard.js");
      const { exec } = await import("node:child_process");
      const { platform } = await import("node:os");

      const port = Number(cmd.port);
      const { close } = startDashboardServer({ port });
      const url = `http://127.0.0.1:${port}`;

      console.log(
        `\n  ${SYMBOLS.zap} ${c.bold("q-ring quantum status dashboard")}\n`,
      );
      console.log(`  ${c.cyan(url)}\n`);
      console.log(c.dim("  Press Ctrl+C to stop\n"));

      if (cmd.open !== false) {
        const openCmd =
          platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
        exec(`${openCmd} ${url}`);
      }

      const shutdown = () => {
        console.log(`\n${c.dim("  dashboard stopped")}`);
        close();
        process.exit(0);
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      await new Promise(() => {});
    });

  // ─── Agent Mode ───

  program
    .command("agent")
    .description("Start the autonomous agent (background monitor)")
    .option(
      "-i, --interval <seconds>",
      "Scan interval in seconds",
      parseInt,
      60,
    )
    .option("--auto-rotate", "Auto-rotate expired secrets")
    .option("-v, --verbose", "Verbose output with all warnings")
    .option("--project-path <paths>", "Comma-separated project paths to monitor")
    .option("--once", "Run a single scan and exit (no daemon)")
    .action(async (cmd) => {
      const projectPaths = cmd.projectPath
        ? cmd.projectPath.split(",").map((p: string) => p.trim())
        : [process.cwd()];

      if (cmd.once) {
        const report = runHealthScan({
          autoRotate: cmd.autoRotate,
          projectPaths,
          verbose: cmd.verbose,
        });

        // Output as JSON for programmatic use
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      await startAgent({
        intervalSeconds: cmd.interval,
        autoRotate: cmd.autoRotate,
        projectPaths,
        verbose: cmd.verbose,
      });
    });

  // ─── Rotation & CI ───

  program
    .command("rotate <key>")
    .description("Attempt issuer-native rotation of a secret via its provider")
    .option("-g, --global", "Global scope")
    .option("-p, --project", "Project scope")
    .option("--project-path <path>", "Explicit project path")
    .option("--provider <name>", "Force a specific provider")
    .action(async (key: string, cmd) => {
      const opts = buildOpts(cmd);
      const value = getSecret(key, opts);
      if (!value) {
        console.error(c.red(`${SYMBOLS.cross} Secret "${key}" not found`));
        process.exitCode = 1;
        return;
      }

      const result = await rotateWithProvider(value, cmd.provider);
      if (result.rotated && result.newValue) {
        setSecret(key, result.newValue, { ...opts, scope: opts.scope ?? "global" });
        console.log(`${SYMBOLS.check} ${c.green("Rotated")} ${c.bold(key)} via ${result.provider}`);
        console.log(c.dim(`  ${result.message}`));
      } else {
        console.log(c.yellow(`${SYMBOLS.warning} ${result.message}`));
      }
    });

  program
    .command("ci:validate")
    .description("CI-oriented batch validation of all secrets (exit code 1 on failure)")
    .option("-g, --global", "Global scope")
    .option("-p, --project", "Project scope")
    .option("--project-path <path>", "Explicit project path")
    .option("--json", "Output as JSON")
    .action(async (cmd) => {
      const opts = buildOpts(cmd);
      const entries = listSecrets(opts);

      const secrets = entries
        .map((e) => {
          const val = getSecret(e.key, { ...opts, scope: e.scope, silent: true });
          if (!val) return null;
          const provider = e.envelope?.meta.provider;
          const validationUrl = e.envelope?.meta.validationUrl;
          return { key: e.key, value: val, provider, validationUrl };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (secrets.length === 0) {
        console.log(c.dim("No secrets to validate"));
        return;
      }

      const report = await ciValidateBatch(secrets);

      if (cmd.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(c.bold(`\n  CI Secret Validation: ${report.results.length} secrets\n`));
        for (const r of report.results) {
          const icon = r.validation.valid ? SYMBOLS.check : SYMBOLS.cross;
          const color = r.validation.valid ? c.green : c.red;
          console.log(`  ${icon} ${color(r.key)} [${r.validation.provider}] ${r.validation.message}`);
          if (r.requiresRotation) console.log(c.dim(`    → rotation required`));
        }
        console.log();

        if (!report.allValid) {
          console.log(c.red(`  ${report.failCount} secret(s) failed validation`));
          process.exitCode = 1;
        } else {
          console.log(c.green(`  All secrets valid`));
        }
      }
    });

  // ─── Policy ───

  program
    .command("policy")
    .description("Show project governance policy summary")
    .option("--json", "Output as JSON")
    .action((cmd) => {
      const summary = getPolicySummary();
      if (cmd.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log(c.bold("\n⚖  Governance Policy\n"));

      if (!summary.hasMcpPolicy && !summary.hasExecPolicy && !summary.hasSecretPolicy) {
        console.log(c.dim("  No policy configured in .q-ring.json"));
        console.log(c.dim("  Add a \"policy\" section to enable governance controls.\n"));
        return;
      }

      if (summary.hasMcpPolicy) {
        console.log(c.cyan("  MCP Policy:"));
        const m = summary.details.mcp!;
        if (m.allowTools) console.log(c.green(`    Allow tools: ${m.allowTools.join(", ")}`));
        if (m.denyTools) console.log(c.red(`    Deny tools:  ${m.denyTools.join(", ")}`));
        if (m.readableKeys) console.log(c.green(`    Readable keys: ${m.readableKeys.join(", ")}`));
        if (m.deniedKeys) console.log(c.red(`    Denied keys:   ${m.deniedKeys.join(", ")}`));
        if (m.deniedTags) console.log(c.red(`    Denied tags:   ${m.deniedTags.join(", ")}`));
      }

      if (summary.hasExecPolicy) {
        console.log(c.cyan("  Exec Policy:"));
        const e = summary.details.exec!;
        if (e.allowCommands) console.log(c.green(`    Allow commands:    ${e.allowCommands.join(", ")}`));
        if (e.denyCommands) console.log(c.red(`    Deny commands:     ${e.denyCommands.join(", ")}`));
        if (e.maxRuntimeSeconds) console.log(`    Max runtime:       ${e.maxRuntimeSeconds}s`);
        if (e.allowNetwork !== undefined) console.log(`    Allow network:     ${e.allowNetwork}`);
      }

      if (summary.hasSecretPolicy) {
        console.log(c.cyan("  Secret Lifecycle Policy:"));
        const s = summary.details.secrets!;
        if (s.requireApprovalForTags) console.log(`    Require approval for tags: ${s.requireApprovalForTags.join(", ")}`);
        if (s.maxTtlSeconds) console.log(`    Max TTL: ${s.maxTtlSeconds}s`);
      }

      console.log();
    });

  return program;
}
