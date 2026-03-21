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
  type KeyringOptions,
  type SetSecretOptions,
} from "../core/keyring.js";
import { startAgent, runHealthScan } from "../core/agent.js";
import type { Scope } from "../core/scope.js";
import { collapseEnvironment } from "../core/collapse.js";
import { checkDecay } from "../core/envelope.js";
import { queryAudit, detectAnomalies } from "../core/observer.js";
import { generateSecret, estimateEntropy, type NoiseFormat } from "../core/noise.js";
import { tunnelCreate, tunnelRead, tunnelDestroy, tunnelList } from "../core/tunnel.js";
import { teleportPack, teleportUnpack } from "../core/teleport.js";
import { promptSecret } from "../utils/prompt.js";
import { c, scopeColor, decayIndicator, envBadge, SYMBOLS } from "../utils/colors.js";

function buildOpts(cmd: {
  global?: boolean;
  project?: boolean;
  projectPath?: string;
  env?: string;
}): KeyringOptions {
  let scope: Scope | undefined;
  if (cmd.global) scope = "global";
  else if (cmd.project) scope = "project";

  const projectPath =
    cmd.projectPath ?? (cmd.project ? process.cwd() : undefined);

  if (scope === "project" && !projectPath) {
    throw new Error("Project path is required for project scope");
  }

  return {
    scope,
    projectPath: projectPath ?? process.cwd(),
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
    .version("0.2.0");

  // ─── Core Commands ───

  program
    .command("set <key> [value]")
    .description("Store a secret (with optional quantum metadata)")
    .option("-g, --global", "Store in global scope")
    .option("-p, --project", "Store in project scope (uses cwd)")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Set value for a specific environment (superposition)")
    .option("--ttl <seconds>", "Time-to-live in seconds (quantum decay)", parseInt)
    .option("--expires <iso>", "Expiry timestamp (ISO 8601)")
    .option("--description <desc>", "Human-readable description")
    .option("--tags <tags>", "Comma-separated tags")
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
    .option("--project-path <path>", "Explicit project path")
    .option("--show-decay", "Show decay/expiry status")
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const entries = listSecrets(opts);

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

        // Scope badge
        parts.push(c.dim("[") + scopeColor(entry.scope) + c.dim("]"));

        // Key name
        parts.push(c.bold(entry.key.padEnd(maxKeyLen)));

        // Superposition indicator
        if (entry.envelope?.states) {
          const envs = Object.keys(entry.envelope.states);
          parts.push(c.magenta(`[${envs.join("|")}]`));
        }

        // Decay indicator
        if (entry.decay && (entry.decay.lifetimePercent > 0 || entry.decay.isExpired)) {
          parts.push(
            decayIndicator(entry.decay.lifetimePercent, entry.decay.isExpired),
          );
          if (entry.decay.timeRemaining && !entry.decay.isExpired) {
            parts.push(c.dim(entry.decay.timeRemaining));
          }
        }

        // Entanglement indicator
        if (
          entry.envelope?.meta.entangled &&
          entry.envelope.meta.entangled.length > 0
        ) {
          parts.push(
            c.cyan(`${SYMBOLS.link} ${entry.envelope.meta.entangled.length}`),
          );
        }

        // Access count
        if (entry.envelope && entry.envelope.meta.accessCount > 0) {
          parts.push(
            c.dim(`${SYMBOLS.eye} ${entry.envelope.meta.accessCount}`),
          );
        }

        // Tags
        if (entry.envelope?.meta.tags && entry.envelope.meta.tags.length > 0) {
          parts.push(
            c.dim(entry.envelope.meta.tags.map((t) => `#${t}`).join(" ")),
          );
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

      console.log(`\n  ${c.bold(SYMBOLS.key + " " + key)}`);
      console.log(`  ${c.dim("scope:")}     ${scopeColor(scope)}`);

      if (envelope.states) {
        console.log(`  ${c.dim("type:")}      ${c.magenta("superposition")}`);
        console.log(`  ${c.dim("states:")}`);
        for (const [env, _] of Object.entries(envelope.states)) {
          const isDefault = env === envelope.defaultEnv;
          console.log(
            `    ${envBadge(env)} ${isDefault ? c.dim("(default)") : ""}`,
          );
        }
      } else {
        console.log(`  ${c.dim("type:")}      ${c.green("collapsed")}`);
      }

      console.log(`  ${c.dim("created:")}   ${envelope.meta.createdAt}`);
      console.log(`  ${c.dim("updated:")}   ${envelope.meta.updatedAt}`);
      console.log(
        `  ${c.dim("accessed:")}  ${envelope.meta.accessCount} times`,
      );

      if (envelope.meta.lastAccessedAt) {
        console.log(
          `  ${c.dim("last read:")} ${envelope.meta.lastAccessedAt}`,
        );
      }

      if (envelope.meta.description) {
        console.log(`  ${c.dim("desc:")}      ${envelope.meta.description}`);
      }

      if (envelope.meta.tags && envelope.meta.tags.length > 0) {
        console.log(
          `  ${c.dim("tags:")}      ${envelope.meta.tags.map((t) => c.cyan(`#${t}`)).join(" ")}`,
        );
      }

      if (decay.timeRemaining) {
        console.log(
          `  ${c.dim("decay:")}     ${decayIndicator(decay.lifetimePercent, decay.isExpired)} ${decay.timeRemaining}`,
        );
      }

      if (
        envelope.meta.entangled &&
        envelope.meta.entangled.length > 0
      ) {
        console.log(`  ${c.dim("entangled:")}`);
        for (const link of envelope.meta.entangled) {
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
    .action((cmd) => {
      const opts = buildOpts(cmd);
      const output = exportSecrets({ ...opts, format: cmd.format });
      process.stdout.write(output + "\n");
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

  return program;
}
