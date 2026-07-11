import { createProgram } from "./cli/commands.js";
import { c, SYMBOLS } from "./utils/colors.js";

const program = createProgram();

// Central error handler: policy denials, keyring backend failures, bad input
// from core throw plain Errors. Show the message, not a Node stack trace.
// Set QRING_DEBUG=1 to get the full stack for bug reports.
try {
  await program.parseAsync();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(c.red(`${SYMBOLS.cross} ${message}`));
  if (process.env.QRING_DEBUG && err instanceof Error && err.stack) {
    console.error(c.dim(err.stack));
  }
  process.exitCode = 1;
}
