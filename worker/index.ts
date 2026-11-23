// In front of the static site: Markdown for agents (Accept: text/markdown), the language form, a stateless MCP server, and the model from R2.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { SERVER } from "../src/lib/agents";
import { TOOLS } from "./tools";

type Env = { ASSETS: Fetcher; MODELS: R2Bucket };

const MARKDOWN: Record<string, string> = { "/": "/index.md", "/ja": "/ja/index.md", "/ja/": "/ja/index.md" };

async function mcp(request: Request): Promise<Response> {
  const server = new Server(SERVER, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema, annotations: { readOnlyHint: true } })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const tool = TOOLS.find((t) => t.name === params.name);
    if (!tool) return { isError: true, content: [{ type: "text", text: `Unknown tool: ${params.name}` }] };
    const data = tool.run(params.arguments);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
  });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return mcp(request);
    if (url.pathname.startsWith("/models/")) {
      const obj = await env.MODELS.get(url.pathname.slice(1));
      if (!obj) return env.ASSETS.fetch(request);
      return new Response(obj.body, {
        headers: { "Content-Type": "model/gltf-binary", "Cache-Control": "public, max-age=86400", ETag: obj.httpEtag },
      });
    }
    if (url.pathname === "/lang") return Response.redirect(new URL(url.searchParams.get("to") === "ja" ? "/ja/" : "/", url).href, 303);

    const md = MARKDOWN[url.pathname];
    if (md && /\btext\/markdown\b/.test(request.headers.get("Accept") ?? "")) {
      const res = await env.ASSETS.fetch(new URL(md, url));
      const text = await res.text();
      return new Response(text, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
          "x-markdown-tokens": String(Math.ceil(new TextEncoder().encode(text).length / 4)), // ponytail: rough estimate (~4 UTF-8 bytes per token), use a tokenizer if anyone relies on it
          "Cache-Control": "public, max-age=300",
        },
      });
    }
    const res = await env.ASSETS.fetch(request);
    if (!md) return res;
    const out = new Response(res.body, res);
    out.headers.append("Vary", "Accept");
    return out;
  },
} satisfies ExportedHandler<Env>;
