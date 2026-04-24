/**
 * Shared HTTP request helper with timeout and response body cap.
 * Used by validation providers and webhook hooks.
 */

import { request as httpsRequest } from "node:https";
import { request as httpRequestPlain } from "node:http";

export interface HttpRequestOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

export interface HttpResponse {
  statusCode: number;
  body: string;
  truncated: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESPONSE_BYTES = 65_536; // 64 KiB

/**
 * Perform an HTTP(S) request with a hard timeout and a cap on the response
 * body size. Always returns a resolved promise unless the network fails or
 * the timeout fires — partial reads are returned with `truncated: true`.
 */
export function httpRequest(opts: HttpRequestOptions): Promise<HttpResponse> {
  const {
    url,
    method = "GET",
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
  } = opts;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      reject(new Error(`Unsupported URL protocol: ${parsed.protocol}`));
      return;
    }
    const reqFn = parsed.protocol === "https:" ? httpsRequest : httpRequestPlain;

    const reqHeaders: Record<string, string | number> = { ...headers };
    if (body && !reqHeaders["Content-Length"]) {
      reqHeaders["Content-Length"] = Buffer.byteLength(body);
    }

    const req = reqFn(
      url,
      { method, headers: reqHeaders, timeout: timeoutMs },
      (res) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        let truncated = false;

        res.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > maxResponseBytes) {
            truncated = true;
            res.destroy();
            return;
          }
          chunks.push(chunk);
        });

        let settled = false;
        const settle = (result: HttpResponse) => {
          if (!settled) { settled = true; resolve(result); }
        };
        const fail = (err: Error) => {
          if (!settled) { settled = true; reject(err); }
        };

        res.on("error", (err) => fail(new Error(`Response error: ${err.message}`)));

        res.on("end", () => {
          settle({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
            truncated,
          });
        });

        res.on("close", () => {
          settle({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
            truncated,
          });
        });
      },
    );

    req.on("error", (err) => reject(new Error(`Network error: ${err.message}`)));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (body) req.write(body);
    req.end();
  });
}
