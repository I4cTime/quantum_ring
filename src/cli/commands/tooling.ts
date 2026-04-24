import type { Command } from "commander";
import { execCommand } from "../../core/exec.js";
import { scanCodebase } from "../../core/scan.js";
import { lintFiles } from "../../core/linter.js";
import { c, SYMBOLS } from "../../utils/colors.js";
import { buildOpts } from "../options.js";

export function registerToolingCommands(program: Command): void {
  program
    .command("exec <command...>")
    .description(
      "Run a command with secrets injected into its environment (output auto-redacted)",
    )
    .option("-g, --global", "Inject global scope secrets only")
    .option("-p, --project", "Inject project scope secrets only")
    .option("--project-path <path>", "Explicit project path")
    .option("-e, --env <env>", "Environment context")
    .option("-k, --keys <keys>", "Comma-separated key names to inject")
    .option("-t, --tags <tags>", "Comma-separated tags to filter by")
    .option(
      "--profile <name>",
      "Exec profile: unrestricted, restricted, ci",
    )
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
        console.error(
          c.red(
            `${SYMBOLS.cross} Exec failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
        process.exit(1);
      }
    });

  program
    .command("scan [dir]")
    .description("Scan a codebase for hardcoded secrets")
    .option(
      "--fix",
      "Auto-replace hardcoded secrets with process.env references and store in q-ring",
    )
    .option("-g, --global", "Store fixed secrets in global scope")
    .option("-p, --project", "Store fixed secrets in project scope")
    .option("--project-path <path>", "Explicit project path")
    .action((dir: string | undefined, cmd) => {
      const targetDir = dir ?? process.cwd();
      const fixMode = cmd.fix === true;
      console.log(
        `\n  ${SYMBOLS.eye} Scanning ${c.bold(targetDir)} for secrets...${fixMode ? c.yellow(" [--fix mode]") : ""}\n`,
      );

      const results = scanCodebase(targetDir);

      if (results.length === 0) {
        console.log(
          `  ${c.green(SYMBOLS.check)} No hardcoded secrets found. Awesome!\n`,
        );
        return;
      }

      if (fixMode) {
        const fileSet = new Set(
          results.map((r) =>
            r.file.startsWith("/") ? r.file : `${targetDir}/${r.file}`,
          ),
        );
        const opts = buildOpts(cmd);
        const lintResults = lintFiles([...fileSet], {
          fix: true,
          scope: opts.scope,
          projectPath: opts.projectPath,
        });
        const fixedCount = lintResults.filter((r) => r.fixed).length;
        console.log(
          `  ${c.green(SYMBOLS.check)} Fixed ${fixedCount} secrets — replaced with process.env references and stored in q-ring.\n`,
        );
        return;
      }

      for (const res of results) {
        console.log(`  ${c.red(SYMBOLS.cross)} ${c.bold(res.file)}:${res.line}`);
        console.log(`    ${c.dim("Key:")}     ${c.cyan(res.keyName)}`);
        console.log(
          `    ${c.dim("Entropy:")} ${res.entropy > 4 ? c.red(res.entropy.toString()) : c.yellow(res.entropy.toString())}`,
        );
        console.log(`    ${c.dim("Context:")} ${res.context}`);
        console.log();
      }

      console.log(
        `  ${c.red(`Found ${results.length} potential secrets.`)} Use ${c.bold("qring scan --fix")} to auto-migrate them.\n`,
      );
    });

  program
    .command("lint <files...>")
    .description(
      "Lint specific files for hardcoded secrets (with optional auto-fix)",
    )
    .option(
      "--fix",
      "Replace hardcoded secrets with process.env references and store in q-ring",
    )
    .option("-g, --global", "Store fixed secrets in global scope")
    .option("-p, --project", "Store fixed secrets in project scope")
    .option("--project-path <path>", "Explicit project path")
    .action((files: string[], cmd) => {
      const opts = buildOpts(cmd);
      const results = lintFiles(files, {
        fix: cmd.fix,
        scope: opts.scope,
        projectPath: opts.projectPath,
      });

      if (results.length === 0) {
        console.log(
          `\n  ${c.green(SYMBOLS.check)} No hardcoded secrets found in ${files.length} file(s).\n`,
        );
        return;
      }

      for (const res of results) {
        const status = res.fixed ? c.green("fixed") : c.red("found");
        console.log(
          `  ${res.fixed ? c.green(SYMBOLS.check) : c.red(SYMBOLS.cross)} ${c.bold(res.file)}:${res.line} [${status}]`,
        );
        console.log(`    ${c.dim("Key:")}     ${c.cyan(res.keyName)}`);
        console.log(
          `    ${c.dim("Entropy:")} ${res.entropy > 4 ? c.red(res.entropy.toString()) : c.yellow(res.entropy.toString())}`,
        );
        console.log();
      }

      const fixedCount = results.filter((r) => r.fixed).length;
      if (cmd.fix && fixedCount > 0) {
        console.log(
          `  ${c.green(`Fixed ${fixedCount} secret(s)`)} — replaced with env references and stored in q-ring.\n`,
        );
      } else {
        console.log(
          `  ${c.red(`Found ${results.length} potential secret(s).`)} Use ${c.bold("--fix")} to auto-migrate.\n`,
        );
      }
    });

  program
    .command("status")
    .description("Launch the quantum status dashboard in your browser")
    .option("--port <port>", "Port to serve on", "9876")
    .option("--no-open", "Don't auto-open the browser")
    .action(async (cmd) => {
      const { startDashboardServer } = await import("../../core/dashboard.js");
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
          platform() === "darwin"
            ? "open"
            : platform() === "win32"
              ? "start"
              : "xdg-open";
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
}
