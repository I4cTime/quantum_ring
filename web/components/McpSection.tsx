"use client";

import { useState, type Key } from "react";
import { Chip, Table, Tabs } from "@heroui/react";

import TerminalCard from "@/components/TerminalCard";
import { MCP_GROUPS, MCP_TOOL_COUNT } from "@/lib/data/mcp-tools";

const CONFIGS = [
  {
    id: "cursor",
    label: "Cursor / Kiro",
    file: ".cursor/mcp.json",
    snippet: `{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`,
  },
  {
    id: "claude",
    label: "Claude Code",
    file: "claude_desktop_config.json",
    snippet: `{
  "mcpServers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    file: ".vscode/mcp.json",
    snippet: `{
  "servers": {
    "q-ring": {
      "command": "qring-mcp"
    }
  }
}`,
  },
] as const;

type ConfigId = (typeof CONFIGS)[number]["id"];

export default function McpSection() {
  const [activeGroup, setActiveGroup] = useState<string>(MCP_GROUPS[0]!.id);
  const [activeConfig, setActiveConfig] = useState<ConfigId>("cursor");

  const current =
    MCP_GROUPS.find((g) => g.id === activeGroup) ?? MCP_GROUPS[0]!;
  const config = CONFIGS.find((c) => c.id === activeConfig) ?? CONFIGS[0];

  return (
    <section className="py-24 relative z-1" id="mcp">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <p className="text-text-dim text-xs uppercase tracking-widest">
            Model Context Protocol
          </p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            MCP Integration
          </h2>
          <p className="text-text-secondary max-w-[640px] mx-auto">
            <strong className="text-text-primary">{MCP_TOOL_COUNT} tools</strong>{" "}
            for seamless AI agent integration. Pick a category to browse the
            tools, then drop the snippet into your editor.
          </p>
        </div>

        <Tabs
          aria-label="MCP tool category"
          selectedKey={activeGroup}
          onSelectionChange={(key: Key) => setActiveGroup(String(key))}
          variant="secondary"
          className="w-full"
        >
          <Tabs.ListContainer>
            <Tabs.List
              aria-label="Categories"
              className="flex-wrap justify-center"
            >
              {MCP_GROUPS.map((g) => (
                <Tabs.Tab key={g.id} id={g.id} className="!w-auto gap-2">
                  <g.Icon className="size-3.5" strokeWidth={2} aria-hidden />
                  <span>{g.title}</span>
                  <Chip size="sm" variant="soft" className="ml-1">
                    {g.tools.length}
                  </Chip>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id={activeGroup} key={activeGroup} className="pt-6">
            <div className="rounded-xl overflow-hidden border border-border/70 bg-bg-card/50 backdrop-blur">
              <Table variant="secondary">
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label={`${current.title} tools`}
                    className="min-w-[640px]"
                  >
                    <Table.Header>
                      <Table.Column isRowHeader>Tool</Table.Column>
                      <Table.Column>Description</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {current.tools.map((tool) => (
                        <Table.Row key={tool.name}>
                          <Table.Cell>
                            <code className="font-[family-name:var(--font-mono)] text-xs text-accent-bright bg-accent-dim px-2 py-1 rounded whitespace-nowrap">
                              {tool.name}
                            </code>
                          </Table.Cell>
                          <Table.Cell className="text-text-secondary text-sm">
                            {tool.desc}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          </Tabs.Panel>
        </Tabs>

        <div className="mt-16">
          <div className="text-center mb-6 space-y-2">
            <p className="text-text-dim text-xs uppercase tracking-widest">
              Configuration
            </p>
            <h3 className="text-2xl font-semibold text-text-primary">
              Drop in your MCP config
            </h3>
            <p className="text-text-secondary text-sm">
              Same single binary, every host. Pick your editor and paste.
            </p>
          </div>

          <Tabs
            aria-label="MCP config preset"
            selectedKey={activeConfig}
            onSelectionChange={(key: Key) =>
              setActiveConfig(key as ConfigId)
            }
            variant="secondary"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Editor" className="justify-center">
                {CONFIGS.map((c) => (
                  <Tabs.Tab key={c.id} id={c.id} className="!w-auto">
                    {c.label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id={activeConfig} key={activeConfig} className="pt-4">
              <div className="max-w-[720px] mx-auto">
                <TerminalCard
                  title={config.file}
                  copyText={config.snippet}
                  maxWidth="720px"
                >
                  <pre className="m-0 text-text-secondary text-sm">
                    {config.snippet}
                  </pre>
                </TerminalCard>
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
