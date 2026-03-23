/**
 * Just-In-Time (JIT) Credential Provisioning
 *
 * Dynamically generates short-lived credentials when requested, caching them
 * until they expire.
 */

import { request as httpsRequest } from "node:https";
import { execFileSync } from "node:child_process";

export interface ProvisionResult {
  value: string;
  expiresAt: string;
}

export interface JitProvider {
  name: string;
  description: string;
  provision(configRaw: string): ProvisionResult;
}

export class ProvisionRegistry {
  private providers = new Map<string, JitProvider>();

  register(provider: JitProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): JitProvider | undefined {
    return this.providers.get(name);
  }

  listProviders(): JitProvider[] {
    return [...this.providers.values()];
  }
}

// Built-in Providers

const awsStsProvider: JitProvider = {
  name: "aws-sts",
  description: "AWS STS AssumeRole (requires existing local AWS CLI credentials)",
  provision(configRaw: string): ProvisionResult {
    let config: any;
    try {
      config = JSON.parse(configRaw);
    } catch {
      throw new Error("aws-sts requires valid JSON config (e.g. {\"roleArn\":\"arn:aws:...\"})");
    }

    const roleArn = config.roleArn;
    const sessionName = config.sessionName || "q-ring-agent";
    const duration = config.durationSeconds || 3600;

    if (!roleArn) throw new Error("aws-sts requires roleArn in config");

    try {
      const output = execFileSync("aws", [
        "sts", "assume-role",
        "--role-arn", roleArn,
        "--role-session-name", sessionName,
        "--duration-seconds", String(duration),
        "--output", "json",
      ], { encoding: "utf8" });
      const parsed = JSON.parse(output);
      const creds = parsed.Credentials;
      
      const value = JSON.stringify({
        AWS_ACCESS_KEY_ID: creds.AccessKeyId,
        AWS_SECRET_ACCESS_KEY: creds.SecretAccessKey,
        AWS_SESSION_TOKEN: creds.SessionToken,
      });
      
      return {
        value,
        expiresAt: creds.Expiration
      };
    } catch (err) {
      throw new Error(`AWS STS provision failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
};

const httpProvider: JitProvider = {
  name: "http",
  description: "Generic HTTP token endpoint (POST) using Node.js https",
  provision(configRaw: string): ProvisionResult {
    let config: any;
    try {
      config = JSON.parse(configRaw);
    } catch {
      throw new Error("http provider requires valid JSON config");
    }

    const url = config.url;
    const method = config.method || "POST";
    const valuePath = config.valuePath || "token"; // dot notation path to value
    const expiresInSeconds = config.expiresInSeconds || 3600;

    if (!url) throw new Error("http provider requires url in config");

    // Use synchronous approach with Node.js https
    const parsedUrl = new URL(url);
    const headers: Record<string, string> = {
      "User-Agent": "q-ring-jit/1.0",
      ...(config.headers ?? {}),
    };
    let bodyStr: string | undefined;
    if (config.body) {
      headers["Content-Type"] = "application/json";
      bodyStr = JSON.stringify(config.body);
    }

    try {
      const output = execFileSync("node", [
        "-e",
        `
const http = require(${JSON.stringify(parsedUrl.protocol === "https:" ? "node:https" : "node:http")});
const options = {
  method: ${JSON.stringify(method)},
  headers: ${JSON.stringify(headers)},
  timeout: 30000,
};
const req = http.request(${JSON.stringify(url)}, options, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => process.stdout.write(body));
});
req.on("error", (e) => { process.stderr.write(e.message); process.exit(1); });
${bodyStr ? `req.write(${JSON.stringify(bodyStr)});` : ""}
req.end();
`,
      ], { encoding: "utf8", timeout: 35000 });

      const parsed = JSON.parse(output);
      let val = parsed;
      for (const key of valuePath.split(".")) {
        val = val[key];
      }
      return {
        value: String(val),
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      };
    } catch (err) {
      throw new Error(`HTTP provision failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
};

export const registry = new ProvisionRegistry();
registry.register(awsStsProvider);
registry.register(httpProvider);
