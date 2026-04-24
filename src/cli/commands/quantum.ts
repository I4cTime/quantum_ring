import type { Command } from "commander";
import {
  getSecret,
  setSecret,
  listSecrets,
  entangleSecrets,
  disentangleSecrets,
  type KeyringOptions,
} from "../../core/keyring.js";
import {
  generateSecret,
  estimateEntropy,
  type NoiseFormat,
} from "../../core/noise.js";
import {
  tunnelCreate,
  tunnelRead,
  tunnelDestroy,
  tunnelList,
} from "../../core/tunnel.js";
import { teleportPack, teleportUnpack } from "../../core/teleport.js";
import { promptSecret } from "../../utils/prompt.js";
import { c, SYMBOLS } from "../../utils/colors.js";
import { buildOpts } from "../options.js";

export function registerQuantumCommands(program: Command): void {
  program
    .command("generate")
    .alias("gen")
    .description("Generate a cryptographic secret (quantum noise)")
    .option(
      "-f, --format <format>",
      "Format: hex, base64, alphanumeric, uuid, api-key, token, password",
      "api-key",
    )
    .option(
      "-l, --length <n>",
      "Length (bytes or chars depending on format)",
      parseInt,
    )
    .option("--prefix <prefix>", "Prefix for api-key/token format")
    .option(
      "-s, --save <key>",
      "Save the generated secret to keyring with this key",
    )
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
    .action((sourceKey: string, targetKey: string, cmd) => {
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
    });

  program
    .command("disentangle <sourceKey> <targetKey>")
    .description("Unlink two entangled secrets")
    .option("-g, --global", "Both in global scope")
    .option("--source-project <path>", "Source project path")
    .option("--target-project <path>", "Target project path")
    .action((sourceKey: string, targetKey: string, cmd) => {
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
    });

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
        console.error(c.red(`${SYMBOLS.cross} Tunnel "${id}" not found`));
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

      console.log(
        c.bold(`\n  ${SYMBOLS.ghost} Active tunnels (${tunnels.length})\n`),
      );
      for (const t of tunnels) {
        const parts = [c.bold(t.id)];
        parts.push(c.dim(`reads: ${t.accessCount}`));
        if (t.maxReads) parts.push(c.dim(`max: ${t.maxReads}`));
        if (t.expiresAt) {
          const remaining = Math.max(
            0,
            Math.floor((t.expiresAt - Date.now()) / 1000),
          );
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
            console.log(
              `  ${SYMBOLS.key} ${c.bold(s.key)} ${c.dim(`[${s.scope ?? "global"}]`)}`,
            );
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
          c.red(
            `${SYMBOLS.cross} Failed to unpack: wrong passphrase or corrupted bundle`,
          ),
        );
        process.exit(1);
      }
    });
}
