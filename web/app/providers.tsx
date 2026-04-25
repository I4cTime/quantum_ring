"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";
import { Toast } from "@heroui/react";
import { CommandPaletteProvider } from "@/lib/command-palette-context";
import CommandPalette from "@/components/CommandPalette";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider locale="en-US">
      <CommandPaletteProvider>
        {children}
        <Toast.Provider placement="bottom" />
        <CommandPalette />
      </CommandPaletteProvider>
    </I18nProvider>
  );
}

