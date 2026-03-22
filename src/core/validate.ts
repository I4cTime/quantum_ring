/**
 * Secret Liveness Validation: test if a secret is actually valid
 * with its target service using a pluggable provider system.
 */

import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

export interface ValidationResult {
  valid: boolean;
  status: "valid" | "invalid" | "error" | "unknown";
  message: string;
  latencyMs: number;
  provider: string;
}

export interface Provider {
  name: string;
  description: string;
  /** Prefixes that auto-detect to this provider */
  prefixes?: string[];
  validate(value: string): Promise<ValidationResult>;
}

function makeRequest(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 10000,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqFn = parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;
    const req = reqFn(
      url,
      { method: "GET", headers, timeout: timeoutMs },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({ statusCode: res.statusCode ?? 0, body }),
        );
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.end();
  });
}

export class ProviderRegistry {
  private providers = new Map<string, Provider>();

  register(provider: Provider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  detectProvider(
    value: string,
    hints?: { provider?: string; prefix?: string },
  ): Provider | undefined {
    if (hints?.provider) {
      return this.providers.get(hints.provider);
    }

    for (const provider of this.providers.values()) {
      if (provider.prefixes) {
        for (const pfx of provider.prefixes) {
          if (value.startsWith(pfx)) return provider;
        }
      }
    }

    return undefined;
  }

  listProviders(): Provider[] {
    return [...this.providers.values()];
  }
}

// ─── Built-in Providers ───

const openaiProvider: Provider = {
  name: "openai",
  description: "OpenAI API key validation",
  prefixes: ["sk-"],
  async validate(value: string): Promise<ValidationResult> {
    const start = Date.now();
    try {
      const { statusCode } = await makeRequest(
        "https://api.openai.com/v1/models?limit=1",
        {
          Authorization: `Bearer ${value}`,
          "User-Agent": "q-ring-validator/1.0",
        },
      );
      const latencyMs = Date.now() - start;

      if (statusCode === 200)
        return { valid: true, status: "valid", message: "API key is valid", latencyMs, provider: "openai" };
      if (statusCode === 401)
        return { valid: false, status: "invalid", message: "Invalid or revoked API key", latencyMs, provider: "openai" };
      if (statusCode === 429)
        return { valid: true, status: "error", message: "Rate limited — key may be valid", latencyMs, provider: "openai" };
      return { valid: false, status: "error", message: `Unexpected status ${statusCode}`, latencyMs, provider: "openai" };
    } catch (err) {
      return { valid: false, status: "error", message: `${err instanceof Error ? err.message : "Network error"}`, latencyMs: Date.now() - start, provider: "openai" };
    }
  },
};

const stripeProvider: Provider = {
  name: "stripe",
  description: "Stripe API key validation",
  prefixes: ["sk_live_", "sk_test_", "rk_live_", "rk_test_", "pk_live_", "pk_test_"],
  async validate(value: string): Promise<ValidationResult> {
    const start = Date.now();
    try {
      const { statusCode } = await makeRequest(
        "https://api.stripe.com/v1/balance",
        {
          Authorization: `Bearer ${value}`,
          "User-Agent": "q-ring-validator/1.0",
        },
      );
      const latencyMs = Date.now() - start;

      if (statusCode === 200)
        return { valid: true, status: "valid", message: "API key is valid", latencyMs, provider: "stripe" };
      if (statusCode === 401)
        return { valid: false, status: "invalid", message: "Invalid or revoked API key", latencyMs, provider: "stripe" };
      if (statusCode === 429)
        return { valid: true, status: "error", message: "Rate limited — key may be valid", latencyMs, provider: "stripe" };
      return { valid: false, status: "error", message: `Unexpected status ${statusCode}`, latencyMs, provider: "stripe" };
    } catch (err) {
      return { valid: false, status: "error", message: `${err instanceof Error ? err.message : "Network error"}`, latencyMs: Date.now() - start, provider: "stripe" };
    }
  },
};

const githubProvider: Provider = {
  name: "github",
  description: "GitHub token validation",
  prefixes: ["ghp_", "gho_", "ghu_", "ghs_", "ghr_", "github_pat_"],
  async validate(value: string): Promise<ValidationResult> {
    const start = Date.now();
    try {
      const { statusCode } = await makeRequest(
        "https://api.github.com/user",
        {
          Authorization: `token ${value}`,
          "User-Agent": "q-ring-validator/1.0",
          Accept: "application/vnd.github+json",
        },
      );
      const latencyMs = Date.now() - start;

      if (statusCode === 200)
        return { valid: true, status: "valid", message: "Token is valid", latencyMs, provider: "github" };
      if (statusCode === 401)
        return { valid: false, status: "invalid", message: "Invalid or expired token", latencyMs, provider: "github" };
      if (statusCode === 403)
        return { valid: false, status: "invalid", message: "Token lacks required permissions", latencyMs, provider: "github" };
      if (statusCode === 429)
        return { valid: true, status: "error", message: "Rate limited — token may be valid", latencyMs, provider: "github" };
      return { valid: false, status: "error", message: `Unexpected status ${statusCode}`, latencyMs, provider: "github" };
    } catch (err) {
      return { valid: false, status: "error", message: `${err instanceof Error ? err.message : "Network error"}`, latencyMs: Date.now() - start, provider: "github" };
    }
  },
};

const awsProvider: Provider = {
  name: "aws",
  description: "AWS access key validation (checks key format only — full STS validation requires secret key + region)",
  prefixes: ["AKIA", "ASIA"],
  async validate(value: string): Promise<ValidationResult> {
    const start = Date.now();
    const latencyMs = Date.now() - start;

    if (/^(AKIA|ASIA)[A-Z0-9]{16}$/.test(value)) {
      return { valid: true, status: "unknown", message: "Valid AWS access key format (STS validation requires secret key)", latencyMs, provider: "aws" };
    }
    return { valid: false, status: "invalid", message: "Invalid AWS access key format", latencyMs, provider: "aws" };
  },
};

const httpProvider: Provider = {
  name: "http",
  description: "Generic HTTP endpoint validation",
  async validate(value: string, url?: string): Promise<ValidationResult> {
    const start = Date.now();

    if (!url) {
      return { valid: false, status: "unknown", message: "No validation URL configured", latencyMs: 0, provider: "http" };
    }

    try {
      const { statusCode } = await makeRequest(url, {
        Authorization: `Bearer ${value}`,
        "User-Agent": "q-ring-validator/1.0",
      });
      const latencyMs = Date.now() - start;

      if (statusCode >= 200 && statusCode < 300)
        return { valid: true, status: "valid", message: `Endpoint returned ${statusCode}`, latencyMs, provider: "http" };
      if (statusCode === 401 || statusCode === 403)
        return { valid: false, status: "invalid", message: `Authentication failed (${statusCode})`, latencyMs, provider: "http" };
      return { valid: false, status: "error", message: `Unexpected status ${statusCode}`, latencyMs, provider: "http" };
    } catch (err) {
      return { valid: false, status: "error", message: `${err instanceof Error ? err.message : "Network error"}`, latencyMs: Date.now() - start, provider: "http" };
    }
  },
};

export const registry = new ProviderRegistry();
registry.register(openaiProvider);
registry.register(stripeProvider);
registry.register(githubProvider);
registry.register(awsProvider);
registry.register(httpProvider);

/**
 * Validate a secret value against its detected or specified provider.
 */
export async function validateSecret(
  value: string,
  opts?: { provider?: string; validationUrl?: string },
): Promise<ValidationResult> {
  const provider = opts?.provider
    ? registry.get(opts.provider)
    : registry.detectProvider(value);

  if (!provider) {
    return {
      valid: false,
      status: "unknown",
      message: "No provider detected — set a provider in the manifest or secret metadata",
      latencyMs: 0,
      provider: "none",
    };
  }

  if (provider.name === "http" && opts?.validationUrl) {
    return (provider as any).validate(value, opts.validationUrl);
  }

  return provider.validate(value);
}
