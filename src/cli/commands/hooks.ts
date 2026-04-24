import type { Command } from "commander";
import {
  registerHook,
  removeHook,
  listHooks as listAllHooks,
  enableHook,
  disableHook,
  fireHooks,
  type HookType,
  type HookAction,
} from "../../core/hooks.js";
import {
  installPreCommitHook,
  uninstallPreCommitHook,
  runPreCommitScan,
} from "../../hooks/precommit.js";
import { c, SYMBOLS } from "../../utils/colors.js";

export function registerHookCommands(program: Command): void {
  // ─── Pre-Commit Hook ───

  program
    .command("hook:install")
    .description(
      "Install a git pre-commit hook that scans for hardcoded secrets",
    )
    .option("--project-path <path>", "Repository path")
    .action((cmd) => {
      const result = installPreCommitHook(cmd.projectPath);
      if (result.installed) {
        console.log(
          `${SYMBOLS.check} ${c.green(result.message)} at ${c.dim(result.path)}`,
        );
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

  // ─── Hook Subcommands ───

  const hook = program
    .command("hook")
    .description(
      "Manage secret change hooks (callbacks on write/delete/rotate)",
    );

  hook
    .command("add")
    .description("Register a new hook")
    .option("--key <key>", "Trigger on exact key match")
    .option("--key-pattern <pattern>", "Trigger on key glob pattern (e.g. DB_*)")
    .option("--tag <tag>", "Trigger on secrets with this tag")
    .option(
      "--scope <scope>",
      "Trigger only for this scope (global or project)",
    )
    .option(
      "--action <actions>",
      "Comma-separated actions: write,delete,rotate",
      "write,delete,rotate",
    )
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
        console.error(
          c.red(`${SYMBOLS.cross} Specify --exec, --url, or --signal-target`),
        );
        process.exit(1);
      }

      if (!cmd.key && !cmd.keyPattern && !cmd.tag) {
        console.error(
          c.red(
            `${SYMBOLS.cross} Specify at least one match criterion: --key, --key-pattern, or --tag`,
          ),
        );
        process.exit(1);
      }

      const actions = cmd.action
        .split(",")
        .map((a: string) => a.trim()) as HookAction[];

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
        signal: cmd.signalTarget
          ? { target: cmd.signalTarget, signal: cmd.signalName }
          : undefined,
        description: cmd.description,
        enabled: true,
      });

      console.log(
        `${SYMBOLS.check} ${c.green("registered")} hook ${c.bold(entry.id)} (${type})`,
      );
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

      console.log(
        c.bold(`\n  ${SYMBOLS.zap} Registered hooks (${hooks.length})\n`),
      );

      for (const h of hooks) {
        const status = h.enabled ? c.green("on") : c.red("off");
        const matchParts: string[] = [];
        if (h.match.key) matchParts.push(`key=${h.match.key}`);
        if (h.match.keyPattern) matchParts.push(`pattern=${h.match.keyPattern}`);
        if (h.match.tag) matchParts.push(`tag=${h.match.tag}`);
        if (h.match.scope) matchParts.push(`scope=${h.match.scope}`);
        if (h.match.action?.length)
          matchParts.push(`actions=${h.match.action.join(",")}`);

        const target =
          h.type === "shell"
            ? h.command
            : h.type === "http"
              ? h.url
              : h.signal
                ? `${h.signal.target} (${h.signal.signal ?? "SIGHUP"})`
                : "?";

        console.log(
          `  ${c.bold(h.id)}  [${status}]  ${c.cyan(h.type)}  ${c.dim(matchParts.join(" "))}`,
        );
        console.log(
          `    ${c.dim("→")} ${target}${h.description ? `  ${c.dim(`— ${h.description}`)}` : ""}`,
        );
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
        console.log(
          `${SYMBOLS.check} ${c.yellow("disabled")} hook ${c.bold(id)}`,
        );
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
        console.log(
          c.yellow(`  ${SYMBOLS.warning} Hook did not match the test payload`),
        );
      }
      console.log();
    });
}
