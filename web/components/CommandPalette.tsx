"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Kbd, toast } from "@heroui/react";
import { Command } from "@heroui-pro/react";
import {
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  Home,
  Plug,
  Search,
  Terminal,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useCommandPalette } from "@/lib/command-palette-context";
import {
  INSTALL_COMMANDS,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "@/lib/data/install";
import { MCP_GROUPS } from "@/lib/data/mcp-tools";
import { CLI_GROUPS } from "@/lib/data/cli-commands";

type NavItem = {
  id: string;
  type: "nav";
  label: string;
  href: string;
  description?: string;
};

type CopyItem = {
  id: string;
  type: "copy";
  label: string;
  value: string;
  description?: string;
};

type PaletteItem = NavItem | CopyItem;

function isCmdK(e: KeyboardEvent) {
  return e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
}

export default function CommandPalette() {
  const { open, setOpen, closePalette } = useCommandPalette();
  const router = useRouter();
  const [activePm, setActivePm] = useState<PackageManager>("pnpm");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isCmdK(e)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const { pages, mcpItems, cliItems, installItem } = useMemo(() => {
    const pages: NavItem[] = [
      { id: "nav-home", type: "nav", label: "Home", href: "/" },
      { id: "nav-docs", type: "nav", label: "Docs · Getting started", href: "/docs" },
      { id: "nav-changelog", type: "nav", label: "Changelog", href: "/changelog" },
      { id: "nav-features", type: "nav", label: "Features", href: "/#features" },
      { id: "nav-mcp", type: "nav", label: "MCP integrations", href: "/#mcp" },
      { id: "nav-why", type: "nav", label: "Why q-ring", href: "/#why" },
      {
        id: "nav-github",
        type: "nav",
        label: "GitHub repository",
        href: "https://github.com/I4cTime/quantum_ring",
        description: "github.com/I4cTime/quantum_ring",
      },
      {
        id: "nav-npm",
        type: "nav",
        label: "npm — @i4ctime/q-ring",
        href: "https://www.npmjs.com/package/@i4ctime/q-ring",
      },
    ];

    const mcpItems: CopyItem[] = MCP_GROUPS.flatMap((group) =>
      group.tools.map<CopyItem>((tool) => ({
        id: `mcp-${tool.name}`,
        type: "copy",
        label: `${group.title} · ${tool.name}`,
        value: tool.name,
        description: tool.desc,
      })),
    );

    const cliItems: CopyItem[] = CLI_GROUPS.flatMap((group) =>
      group.commands.map<CopyItem>((cmd) => ({
        id: `cli-${cmd.command}`,
        type: "copy",
        label: cmd.command,
        value: cmd.example,
        description: cmd.desc,
      })),
    );

    const installItem: CopyItem = {
      id: `copy-install-${activePm}`,
      type: "copy",
      label: `Copy install command (${activePm})`,
      value: INSTALL_COMMANDS[activePm],
    };

    return { pages, mcpItems, cliItems, installItem };
  }, [activePm]);

  const itemMap = useMemo(() => {
    const m = new Map<string, PaletteItem>();
    for (const item of [...pages, ...mcpItems, ...cliItems, installItem]) {
      m.set(item.id, item);
    }
    return m;
  }, [pages, mcpItems, cliItems, installItem]);

  const onSelect = useCallback(
    async (item: PaletteItem) => {
      if (item.type === "nav") {
        closePalette();
        if (item.href.startsWith("http")) {
          window.open(item.href, "_blank", "noopener,noreferrer");
        } else {
          router.push(item.href);
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(item.value);
        toast.success("Copied to clipboard.", { description: item.value });
      } catch {
        toast.danger("Copy failed.", {
          description: "Clipboard permission denied.",
        });
      } finally {
        closePalette();
      }
    },
    [closePalette, router],
  );

  return (
    <Command>
      <Command.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Command.Container>
          <Command.Dialog>
            <Command.Header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Command Palette</span>
                <span className="text-xs text-muted">q-ring</span>
              </div>
              <Kbd className="text-xs">
                <Kbd.Content>Esc</Kbd.Content>
              </Kbd>
            </Command.Header>

            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <Search className="size-4" aria-hidden />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder="Search MCP tools, CLI commands, pages…" />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <Kbd className="text-xs">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </Command.InputGroup.Suffix>
            </Command.InputGroup>

            <Command.List
              onAction={(key) => {
                const item = itemMap.get(String(key));
                if (item) void onSelect(item);
              }}
              className="max-h-[60vh] overflow-y-auto"
            >
              <Command.Group heading="Pages">
                {pages.map((item) => (
                  <Command.Item key={item.id} id={item.id} textValue={item.label}>
                    {item.href.startsWith("http") ? (
                      <ExternalLink className="size-4" aria-hidden />
                    ) : item.href.startsWith("/docs") ? (
                      <FileText className="size-4" aria-hidden />
                    ) : item.href.startsWith("/changelog") ? (
                      <GitBranch className="size-4" aria-hidden />
                    ) : (
                      <Home className="size-4" aria-hidden />
                    )}
                    <div className="flex flex-col text-left">
                      <span>{item.label}</span>
                      {item.description ? (
                        <span className="text-muted text-xs">{item.description}</span>
                      ) : null}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Install">
                <div className="px-3 py-2 flex flex-wrap items-center gap-2">
                  {PACKAGE_MANAGERS.map((pm) => (
                    <Button
                      key={pm}
                      size="sm"
                      variant={pm === activePm ? "primary" : "outline"}
                      onPress={() => setActivePm(pm)}
                    >
                      {pm}
                    </Button>
                  ))}
                </div>
                <Command.Item
                  id={installItem.id}
                  textValue={`Copy install command ${activePm}`}
                >
                  <Copy className="size-4" aria-hidden />
                  <span className="font-[family-name:var(--font-mono)] text-sm">
                    {installItem.value}
                  </span>
                </Command.Item>
              </Command.Group>

              {MCP_GROUPS.map((group) => (
                <Command.Group
                  key={`mcp-${group.id}`}
                  heading={`MCP · ${group.title}`}
                >
                  {group.tools.map((tool) => (
                    <Command.Item
                      key={`mcp-${tool.name}`}
                      id={`mcp-${tool.name}`}
                      textValue={`${tool.name} ${tool.desc}`}
                    >
                      <Plug className="size-4" aria-hidden />
                      <div className="flex flex-col text-left">
                        <span className="font-[family-name:var(--font-mono)] text-sm">
                          {tool.name}
                        </span>
                        <span className="text-muted text-xs">{tool.desc}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}

              {CLI_GROUPS.map((group) => (
                <Command.Group
                  key={`cli-${group.id}`}
                  heading={`CLI · ${group.title}`}
                >
                  {group.commands.map((cmd) => (
                    <Command.Item
                      key={`cli-${cmd.command}`}
                      id={`cli-${cmd.command}`}
                      textValue={`${cmd.command} ${cmd.example} ${cmd.desc}`}
                    >
                      <Terminal className="size-4" aria-hidden />
                      <div className="flex flex-col text-left">
                        <span className="font-[family-name:var(--font-mono)] text-sm">
                          {cmd.command}
                        </span>
                        <span className="text-muted text-xs">{cmd.desc}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
