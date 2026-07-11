import { createInterface } from "node:readline";

export async function promptSecret(message: string): Promise<string> {
  const stdin = process.stdin;

  // Non-interactive stdin (e.g. `echo "$VALUE" | qring set KEY`): read to EOF.
  // The interactive path below waits on per-keypress data events that never
  // arrive from a pipe, which would hang forever.
  if (!stdin.isTTY) {
    let data = "";
    stdin.setEncoding("utf8");
    for await (const chunk of stdin) {
      data += chunk;
    }
    const value = data.replace(/\r?\n$/, "");
    if (value.length === 0) {
      throw new Error(
        "No value provided: stdin is not a terminal and was empty. Pipe the value in, or pass it as an argument.",
      );
    }
    return value;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });

  return new Promise((resolve) => {
    process.stderr.write(message);

    const wasRaw = stdin.isRaw;
    if (stdin.isTTY && stdin.setRawMode) {
      stdin.setRawMode(true);
    }

    let input = "";

    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8");
      if (char === "\n" || char === "\r") {
        stdin.removeListener("data", onData);
        if (stdin.isTTY && stdin.setRawMode) {
          stdin.setRawMode(wasRaw ?? false);
        }
        process.stderr.write("\n");
        rl.close();
        resolve(input);
      } else if (char === "\u0003") {
        process.exit(1);
      } else if (char === "\u007F" || char === "\b") {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };

    stdin.on("data", onData);
  });
}
