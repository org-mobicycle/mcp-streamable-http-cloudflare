/**
 * MCP Streamable HTTP Server — Cloudflare Worker
 *
 * Deploys your KV operations + email pipeline tools as a remote MCP server.
 * Uses createMcpHandler for Streamable HTTP transport (MCP spec 2025-03-26+).
 *
 * Key difference from stdio version:
 *   - KV accessed via Worker bindings (no API token, no HTTP overhead)
 *   - Runs at the edge, accessible from any MCP client over HTTPS
 *   - No local filesystem access (no wrangler token, no osascript)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Env, NAMESPACE_MAP, FOLDER_BINDING_MAP } from "./env.js";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve a namespace name (e.g. "court-of-appeal") to the KV binding */
function resolveKV(env: Env, nameOrBinding: string): KVNamespace {
  // Try direct binding name first (e.g. "KV_COURT_OF_APPEAL")
  if (nameOrBinding in env) {
    return (env as any)[nameOrBinding] as KVNamespace;
  }
  // Try human-readable name (e.g. "court-of-appeal")
  const bindingKey = NAMESPACE_MAP[nameOrBinding];
  if (bindingKey && bindingKey in env) {
    return (env as any)[bindingKey] as KVNamespace;
  }
  throw new Error(
    `Unknown namespace: "${nameOrBinding}". Available: ${Object.keys(NAMESPACE_MAP).join(", ")}`
  );
}

/** List all keys, paginating automatically */
async function listAllKeys(kv: KVNamespace, prefix?: string): Promise<string[]> {
  const all: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await kv.list({ prefix, cursor, limit: 1000 });
    all.push(...result.keys.map((k) => k.name));
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);
  return all;
}

// ── Server factory ─────────────────────────────────────────────────────────

function createServer(env: Env): McpServer {
  const server = new McpServer({
    name: "mobicycle-ou",
    version: "1.0.0",
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // KV Tools
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  server.registerTool(
    "kv_keys_list",
    {
      description:
        "List keys in a KV namespace. Use human-readable names like 'court-of-appeal', 'liu', 'ico', etc.",
      inputSchema: {
        namespace: z.string().describe("Namespace name (e.g. 'court-of-appeal', 'liu', 'email-bodies')"),
        prefix: z.string().optional().describe("Key prefix filter"),
        limit: z.number().optional().default(100).describe("Max keys per page (default 100)"),
        cursor: z.string().optional().describe("Pagination cursor from previous call"),
      },
    },
    async ({ namespace, prefix, limit, cursor }) => {
      const kv = resolveKV(env, namespace);
      const result = await kv.list({ prefix, limit, cursor });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                keys: result.keys.map((k) => k.name),
                count: result.keys.length,
                list_complete: result.list_complete,
                cursor: result.list_complete ? null : result.cursor,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "kv_keys_count",
    {
      description: "Count total keys in a KV namespace (paginates automatically)",
      inputSchema: {
        namespace: z.string().describe("Namespace name"),
        prefix: z.string().optional().describe("Key prefix filter"),
      },
    },
    async ({ namespace, prefix }) => {
      const kv = resolveKV(env, namespace);
      const all = await listAllKeys(kv, prefix);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: all.length, prefix: prefix || null }) }],
      };
    }
  );

  server.registerTool(
    "kv_key_get",
    {
      description: "Get the value of a single key",
      inputSchema: {
        namespace: z.string().describe("Namespace name"),
        key: z.string().describe("Key to retrieve"),
      },
    },
    async ({ namespace, key }) => {
      const kv = resolveKV(env, namespace);
      const value = await kv.get(key);
      if (value === null) {
        return { content: [{ type: "text", text: `Key "${key}" not found` }], isError: true };
      }
      return { content: [{ type: "text", text: value }] };
    }
  );

  server.registerTool(
    "kv_key_put",
    {
      description: "Write a key-value pair to a KV namespace",
      inputSchema: {
        namespace: z.string().describe("Namespace name"),
        key: z.string().describe("Key to write"),
        value: z.string().describe("Value to store"),
        metadata: z.record(z.any()).optional().describe("Optional metadata object"),
      },
    },
    async ({ namespace, key, value, metadata }) => {
      const kv = resolveKV(env, namespace);
      await kv.put(key, value, metadata ? { metadata } : undefined);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, key }) }] };
    }
  );

  server.registerTool(
    "kv_key_delete",
    {
      description: "Delete a key from a KV namespace",
      inputSchema: {
        namespace: z.string().describe("Namespace name"),
        key: z.string().describe("Key to delete"),
      },
    },
    async ({ namespace, key }) => {
      const kv = resolveKV(env, namespace);
      await kv.delete(key);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, key, deleted: true }) }] };
    }
  );

  server.registerTool(
    "kv_keys_bulk_get",
    {
      description: "Get values for multiple keys at once (max 100)",
      inputSchema: {
        namespace: z.string().describe("Namespace name"),
        keys: z.array(z.string()).max(100).describe("Array of keys"),
      },
    },
    async ({ namespace, keys }) => {
      const kv = resolveKV(env, namespace);
      const results: Record<string, string | null> = {};
      await Promise.all(
        keys.map(async (key) => {
          results[key] = await kv.get(key);
        })
      );
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Namespace discovery
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  server.registerTool(
    "namespaces_list",
    {
      description: "List all available KV namespace names and their categories",
      inputSchema: {},
    },
    async () => {
      const categories: Record<string, string[]> = {
        system: ["bridge-accounts", "email-bodies"],
        courts: [
          "court-of-appeal", "chancery", "admin-court", "kings-bench",
          "supreme", "clerkenwell", "central-london",
        ],
        claimants: ["liu", "hk-law", "lessel", "letting-agents", "barristers"],
        government: ["gld", "us-state-dept", "estonia"],
        complaints: ["hmcts", "ico", "phso", "bar-standards", "parliament"],
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total: Object.keys(NAMESPACE_MAP).length, categories },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Email / Folder tools
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  server.registerTool(
    "email_list_folders",
    {
      description:
        "List IMAP folders that are mapped to KV namespaces for email processing",
      inputSchema: {},
    },
    async () => {
      const folders = Object.entries(FOLDER_BINDING_MAP).map(([folder, { binding, humanName }]) => ({
        folder,
        binding,
        humanName,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ total: folders.length, folders }, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "email_folder_stats",
    {
      description: "Get email processing stats for a mapped IMAP folder",
      inputSchema: {
        folder: z.string().describe("IMAP folder path (e.g. 'INBOX/Courts/Court of Appeal')"),
      },
    },
    async ({ folder }) => {
      const mapping = FOLDER_BINDING_MAP[folder];
      if (!mapping) {
        return {
          content: [
            {
              type: "text",
              text: `Folder "${folder}" is not mapped. Use email_list_folders to see available folders.`,
            },
          ],
          isError: true,
        };
      }
      const kv = (env as any)[mapping.binding] as KVNamespace;
      const keys = await listAllKeys(kv, "email:");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                folder,
                humanName: mapping.humanName,
                binding: mapping.binding,
                emailCount: keys.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "email_store",
    {
      description:
        "Store an email's metadata in its folder KV namespace and body in the shared email-bodies namespace",
      inputSchema: {
        folder: z.string().describe("IMAP folder path"),
        key: z.string().describe("KV key for the email metadata (use your KV key format)"),
        metadata: z.string().describe("JSON string of email metadata"),
        body_key: z.string().describe("UUID v5 key for the email body"),
        body: z.string().describe("Email body text"),
      },
    },
    async ({ folder, key, metadata, body_key, body }) => {
      const mapping = FOLDER_BINDING_MAP[folder];
      if (!mapping) {
        return {
          content: [{ type: "text", text: `Folder "${folder}" is not mapped` }],
          isError: true,
        };
      }
      const folderKV = (env as any)[mapping.binding] as KVNamespace;

      // Store metadata in folder namespace
      await folderKV.put(key, metadata, {
        metadata: { folder, body_uuid: body_key, stored_at: new Date().toISOString() },
      });

      // Store body in shared namespace
      await env.EMAIL_BODIES.put(body_key, body, {
        metadata: { folder, humanName: mapping.humanName, stored_at: new Date().toISOString() },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, metadata_key: key, body_key }),
          },
        ],
      };
    }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pipeline / Triage helpers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  server.registerTool(
    "pipeline_status",
    {
      description: "Get pipeline health — counts across all mapped namespaces",
      inputSchema: {},
    },
    async () => {
      const stats: Record<string, number> = {};
      for (const [name, bindingKey] of Object.entries(NAMESPACE_MAP)) {
        if (name === "email-bodies" || name === "bridge-accounts") continue;
        try {
          const kv = (env as any)[bindingKey] as KVNamespace;
          const result = await kv.list({ limit: 1 });
          // Use list_complete + count heuristic (full count requires pagination)
          stats[name] = result.keys.length;
          if (!result.list_complete) stats[name] = -1; // means "more than 1"
        } catch {
          stats[name] = -1;
        }
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { status: "ok", namespace_counts: stats, note: "-1 means namespace has >1 key (use kv_keys_count for exact)" },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}

// ── Worker entry point ─────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "mobicycle-ou-mcp",
          version: "1.0.0",
          transport: "streamable-http",
          mcp_endpoint: "/mcp",
          status: "ok",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // MCP endpoint — Streamable HTTP
    if (url.pathname === "/mcp") {
      const server = createServer(env);
      
      // Handle MCP Streamable HTTP protocol
      if (request.method === "POST") {
        const body = await request.text();
        const message = JSON.parse(body);
        
        // Process the MCP request
        const result = await new Promise((resolve, reject) => {
          const transport = {
            send: (data: any) => resolve(data),
            close: () => {},
            onerror: reject,
            onclose: () => {},
            onmessage: () => {}
          };
          
          server.connect(transport as any);
          (server as any).onRequest?.(message, (response: any) => {
            resolve(response);
          });
        });
        
        return new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
      
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
      
      return new Response("Method not allowed", { status: 405 });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;