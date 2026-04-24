import type { Command } from "commander";
import {
  getSecret,
  setSecret,
  getEnvelope,
} from "../../core/keyring.js";
import { collapseEnvironment, readProjectConfig } from "../../core/collapse.js";
import { checkDecay } from "../../core/envelope.js";
import { generateSecret } from "../../core/noise.js";
import { getProjectContext } from "../../core/context.js";
import { registerHook, type HookType, type HookAction } from "../../core/hooks.js";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { c, scopeColor, envBadge, SYMBOLS } from "../../utils/colors.js";
import { wantsJsonOutput } from "../helpers.js";
import { buildOpts } from "../options.js";

export function registerProjectCommands(program: Command): void {
  program
    .command("context")
    .alias("describe")
    .description(
      "Show safe, redacted project context for AI agents (no secret values exposed)",
    )
    .option("-g, --global", "Global scope only")
    .option("-p, --project", "Project scope only")
    .option("--project-path <path>", "Explicit project path")
    .option("--json", "Output as JSON (for MCP / programmatic use)")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const context = getProjectContext(opts);

      if (wantsJsonOutput(program, cmd)) {
        console.log(JSON.stringify(context, null, 2));
        return;
      }

      console.log(`\n${SYMBOLS.zap} ${c.bold("Project Context for AI Assistant")}`);
      console.log(`  Project: ${c.cyan(context.projectPath)}`);

      if (context.environment) {
        console.log(
          `  Environment: ${envBadge(context.environment.env)} ${c.dim(`(${context.environment.source})`)}`,
        );
      }

      console.log(
        `\n${c.bold("  Secrets:")} ${context.totalSecrets} total  ${c.dim(`(${context.expiredCount} expired, ${context.staleCount} stale, ${context.protectedCount} protected)`)}`,
      );
      for (const s of context.secrets) {
        const tags = s.tags?.length ? c.dim(` [${s.tags.join(",")}]`) : "";
        const flags: string[] = [];
        if (s.requiresApproval) flags.push(c.yellow("locked"));
        if (s.jitProvider) flags.push(c.magenta("jit"));
        if (s.hasStates) flags.push(c.blue("superposition"));
        if (s.isExpired) flags.push(c.red("expired"));
        else if (s.isStale) flags.push(c.yellow("stale"));
        const flagStr = flags.length ? ` ${flags.join(" ")}` : "";
        console.log(
          `    ${c.bold(s.key)} ${scopeColor(s.scope)}${tags}${flagStr}`,
        );
      }

      if (context.manifest) {
        console.log(
          `\n${c.bold("  Manifest:")} ${context.manifest.declared} declared`,
        );
        if (context.manifest.missing.length > 0) {
          console.log(
            `    ${c.red("Missing:")} ${context.manifest.missing.join(", ")}`,
          );
        } else {
          console.log(
            `    ${c.green(SYMBOLS.check)} All manifest secrets present`,
          );
        }
      }

      console.log(
        `\n${c.bold("  Providers:")} ${context.validationProviders.join(", ") || "none"}`,
      );
      console.log(
        `${c.bold("  JIT Providers:")} ${context.jitProviders.join(", ") || "none"}`,
      );
      console.log(`${c.bold("  Hooks:")} ${context.hooksCount} registered`);

      if (context.recentActions.length > 0) {
        console.log(
          `\n${c.bold("  Recent Activity:")} (last ${context.recentActions.length})`,
        );
        for (const a of context.recentActions.slice(0, 8)) {
          const ts = new Date(a.timestamp).toLocaleTimeString();
          console.log(
            `    ${c.dim(ts)} ${a.action}${a.key ? ` ${c.bold(a.key)}` : ""} ${c.dim(`(${a.source})`)}`,
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
          c.dim(
            '  Add a "secrets" field to your .q-ring.json to define required secrets.',
          ),
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
          c.dim(
            "No environment detected. Set QRING_ENV, NODE_ENV, or create .q-ring.json",
          ),
        );
      }
    });

  program
    .command("env:generate")
    .description(
      "Generate a .env file from the project manifest (.q-ring.json)",
    )
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
          lines.push(
            `# ${key}= ${manifest.description ? `# ${manifest.description}` : ""}`,
          );
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

  program
    .command("wizard <name>")
    .description(
      "Set up a new service integration with secrets, manifest, and hooks",
    )
    .option(
      "--keys <keys>",
      "Comma-separated secret key names to create (e.g. API_KEY,API_SECRET)",
    )
    .option(
      "--provider <provider>",
      "Validation provider (e.g. openai, stripe, github)",
    )
    .option("--tags <tags>", "Comma-separated tags for all secrets")
    .option(
      "--hook-exec <cmd>",
      "Shell command to run when any of these secrets change",
    )
    .option("-g, --global", "Global scope")
    .option("-p, --project", "Project scope")
    .option("--project-path <path>", "Explicit project path")
    .action(async (name: string, cmd) => {
      const opts = buildOpts(cmd);
      const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      const tags = cmd.tags?.split(",").map((t: string) => t.trim()) ?? [
        name.toLowerCase(),
      ];
      const provider = cmd.provider;

      let keyNames: string[];
      if (cmd.keys) {
        keyNames = cmd.keys.split(",").map((k: string) => k.trim());
      } else {
        keyNames = [`${prefix}_API_KEY`, `${prefix}_API_SECRET`];
      }

      console.log(`\n${SYMBOLS.zap} ${c.bold(`Setting up service: ${name}`)}\n`);

      for (const key of keyNames) {
        const value = generateSecret({
          format: "api-key",
          prefix: `${prefix.toLowerCase()}_`,
        });
        setSecret(key, value, {
          ...opts,
          tags,
          provider,
          description: `Auto-generated by wizard for ${name}`,
        });
        console.log(`  ${c.green(SYMBOLS.check)} Created ${c.bold(key)}`);
      }

      const projectPath = opts.projectPath ?? process.cwd();
      const manifestPath = `${projectPath}/.q-ring.json`;
      let config: {
        secrets?: Record<
          string,
          { required?: boolean; description?: string; provider?: string }
        >;
      } = {};
      try {
        if (existsSync(manifestPath)) {
          config = JSON.parse(readFileSync(manifestPath, "utf8"));
        }
      } catch {
        /* ignore parse failures; we'll overwrite with a valid object */
      }

      if (!config.secrets) config.secrets = {};
      for (const key of keyNames) {
        config.secrets[key] = {
          required: true,
          description: `${name} integration`,
          ...(provider ? { provider } : {}),
        };
      }

      writeFileSync(manifestPath, JSON.stringify(config, null, 2) + "\n", "utf8");
      console.log(
        `  ${c.green(SYMBOLS.check)} Updated ${c.dim(".q-ring.json")} manifest`,
      );

      if (cmd.hookExec) {
        for (const key of keyNames) {
          registerHook({
            type: "shell" as HookType,
            match: {
              key,
              action: ["write" as HookAction, "delete" as HookAction],
            },
            command: cmd.hookExec,
            description: `${name} wizard hook`,
            enabled: true,
          });
        }
        console.log(
          `  ${c.green(SYMBOLS.check)} Registered hook: ${c.dim(cmd.hookExec)}`,
        );
      }

      console.log(
        `\n  ${c.green("Done!")} Service "${name}" is ready with ${keyNames.length} secrets.\n`,
      );
    });
}
