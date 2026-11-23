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
    if (url.pathname === "/lang") {
      // 選んだ言語は覚えておき、次に / を開いたときもそれを出す
      const ja = url.searchParams.get("to") === "ja";
      return new Response(null, {
        status: 303,
        headers: { Location: new URL(ja ? "/ja/" : "/", url).href, "Set-Cookie": `lang=${ja ? "ja" : "en"}; Path=/; Max-Age=31536000; SameSite=Lax; Secure` },
      });
    }
    // / は、言語を選んだことがなければブラウザの一番の言語が日本語のとき /ja/ へ
    if (url.pathname === "/" && !/\btext\/markdown\b/.test(request.headers.get("Accept") ?? "")) {
      const chosen = /(?:^|;\s*)lang=(en|ja)\b/.exec(request.headers.get("Cookie") ?? "")?.[1];
      const preferred = (request.headers.get("Accept-Language") ?? "").split(",")[0].trim().toLowerCase();
      if (chosen === "ja" || (!chosen && preferred.startsWith("ja"))) {
        return new Response(null, { status: 302, headers: { Location: new URL("/ja/", url).href, Vary: "Accept-Language, Cookie" } });
      }
    }

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
    out.headers.append("Vary", url.pathname === "/" ? "Accept, Accept-Language, Cookie" : "Accept");
    return out;
  },
} satisfies ExportedHandler<Env>;
