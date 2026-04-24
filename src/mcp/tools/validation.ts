import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getSecret,
  setSecret,
  getEnvelope,
  listSecrets,
} from "../../core/keyring.js";
import type { Scope } from "../../core/scope.js";
import {
  validateSecret,
  rotateWithProvider,
  ciValidateBatch,
  registry as providerRegistry,
} from "../../core/validate.js";
import { text, opts, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { teamId, orgId, scope, projectPath } = commonSchemas;

export function registerValidationTools(server: McpServer): void {
  server.tool(
    "validate_secret",
    "[validation] Test if a secret is actually valid with its target service (e.g., OpenAI, Stripe, GitHub). Uses provider auto-detection based on key prefixes, or accepts an explicit provider name. Never logs the secret value.",
    {
      key: z.string().describe("The secret key name"),
      provider: z
        .string()
        .optional()
        .describe("Force a specific provider (openai, stripe, github, aws, http)"),
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("validate_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const value = getSecret(params.key, opts(params));
      if (value === null) return text(`Secret "${params.key}" not found`, true);

      const envelope = getEnvelope(params.key, opts(params));
      const provHint = params.provider ?? envelope?.envelope.meta.provider;

      const result = await validateSecret(value, { provider: provHint });
      return text(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    "list_providers",
    "[validation] List all available validation providers for secret liveness testing.",
    {},
    async () => {
      const toolBlock = enforceToolPolicy("list_providers");
      if (toolBlock) return toolBlock;

      const providers = providerRegistry.listProviders().map((p) => ({
        name: p.name,
        description: p.description,
        prefixes: p.prefixes ?? [],
      }));
      return text(JSON.stringify(providers, null, 2));
    },
  );

  server.tool(
    "rotate_secret",
    "[validation] Attempt issuer-native rotation of a secret via its detected or specified provider. Returns rotation result.",
    {
      key: z.string().describe("The secret key to rotate"),
      provider: z.string().optional().describe("Force a specific provider"),
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("rotate_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const value = getSecret(params.key, opts(params));
      if (!value) return text(`Secret "${params.key}" not found`, true);

      const result = await rotateWithProvider(value, params.provider);
      if (result.rotated && result.newValue) {
        setSecret(params.key, result.newValue, {
          scope: (params.scope as Scope) ?? "global",
          projectPath: params.projectPath,
          source: "mcp",
        });
      }
      return text(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    "ci_validate_secrets",
    "[validation] CI-oriented batch validation: validates all accessible secrets against their providers and returns a structured pass/fail report.",
    {
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy(
        "ci_validate_secrets",
        params.projectPath,
      );
      if (toolBlock) return toolBlock;

      const entries = listSecrets(opts(params));
      const secrets = entries
        .map((e) => {
          const val = getSecret(e.key, {
            ...opts(params),
            scope: e.scope,
            silent: true,
          });
          if (!val) return null;
          return {
            key: e.key,
            value: val,
            provider: e.envelope?.meta.provider,
            validationUrl: e.envelope?.meta.validationUrl,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (secrets.length === 0) return text("No secrets to validate");

      const report = await ciValidateBatch(secrets);
      return text(JSON.stringify(report, null, 2));
    },
  );
}
