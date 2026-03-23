/**
 * Just-In-Time (JIT) Credential Provisioning
 *
 * Dynamically generates short-lived credentials when requested, caching them
 * until they expire.
 */

import { request as httpsRequest } from "node:https";
import { execSync } from "node:child_process";

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

    const cmd = `aws sts assume-role --role-arn "${roleArn}" --role-session-name "${sessionName}" --duration-seconds ${duration} --output json`;
    
    try {
      const output = execSync(cmd, { encoding: "utf8" });
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
  description: "Generic HTTP token endpoint (POST) using curl",
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

    // Build curl command securely
    let cmd = `curl -s -X ${method} "${url}"`;
    if (config.headers) {
      for (const [k, v] of Object.entries(config.headers)) {
        cmd += ` -H "${k}: ${v}"`;
      }
    }
    if (config.body) {
      cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(config.body).replace(/'/g, "'\\''")}'`;
    }

    try {
      const output = execSync(cmd, { encoding: "utf8" });
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
