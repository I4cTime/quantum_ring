export const INSTALL_COMMANDS: Record<string, string> = {
  pnpm: "pnpm add -g @i4ctime/q-ring",
  npm: "npm install -g @i4ctime/q-ring",
  yarn: "yarn global add @i4ctime/q-ring",
  bun: "bun add -g @i4ctime/q-ring",
  brew: "brew install i4ctime/tap/qring",
};

export type PackageManager = keyof typeof INSTALL_COMMANDS;

export const PACKAGE_MANAGERS = Object.keys(INSTALL_COMMANDS) as PackageManager[];
