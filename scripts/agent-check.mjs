// Local stand-in for isitagentready.com (which can't reach localhost): the pass conditions from its check skills.
// Usage: node scripts/agent-check.mjs [base]   (default http://127.0.0.1:8787). In production use POST https://isitagentready.com/api/scan.
import { createHash } from "node:crypto";

const base = process.argv[2] ?? "http://127.0.0.1:8787";
const get = (path, headers = {}) => fetch(new URL(path, base), { headers, redirect: "manual" });
const results = [];
const check = async (name, fn) => {
  try {
    const why = await fn();
    results.push([name, why === true, why === true ? "" : why]);
  } catch (e) {
    results.push([name, false, String(e)]);
  }
};
const json = async (path, type = "application/json") => {
  const r = await get(path);
  if (r.status !== 200) throw new Error(`${path}: ${r.status}`);
  if (!r.headers.get("content-type")?.startsWith(type)) throw new Error(`${path}: ${r.headers.get("content-type")}`);
  return [await r.json(), r];
};

const robots = await (await get("/robots.txt")).text();
await check("robotsTxt", async () => /^User-agent:/im.test(robots) || "no User-agent");
await check("sitemap", async () => /^Sitemap:\s*\S+/im.test(robots) && (await get("/sitemap-index.xml")).status === 200 || "no sitemap");
await check("robotsTxtAiRules", async () => ["GPTBot", "ClaudeBot", "OAI-SearchBot", "Claude-SearchBot"].every((b) => robots.includes(`User-agent: ${b}`)) || "missing AI bots");
await check("contentSignals", async () => ["ai-train", "search", "ai-input"].every((k) => new RegExp(`^Content-Signal:.*\\b${k}=(yes|no)`, "im").test(robots)) || "no Content-Signal");
await check("linkHeaders", async () => /rel="api-catalog"/.test((await get("/")).headers.get("link") ?? "") || "no Link header");
await check("markdownNegotiation", async () => {
  const r = await get("/", { Accept: "text/markdown" });
  return (r.headers.get("content-type")?.startsWith("text/markdown") && r.headers.has("x-markdown-tokens") && (await r.text()).startsWith("# ")) || "not markdown";
});
await check("apiCatalog", async () => {
  const [d] = await json("/.well-known/api-catalog", "application/linkset+json");
  return d.linkset?.every((e) => e.anchor && e["service-desc"] && e["service-doc"]) || "bad linkset";
});
await check("mcpServerCard", async () => {
  const [d] = await json("/.well-known/mcp/server-card.json");
  return !!(d.serverInfo?.name && d.serverInfo?.version && d.transport?.endpoint && d.capabilities) || "missing fields";
});
await check("mcpEndpoint", async () => {
  const r = await fetch(new URL("/mcp", base), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  return (await r.json()).result?.tools?.length > 0 || "no tools";
});
await check("agentSkills", async () => {
  const [d] = await json("/.well-known/agent-skills/index.json");
  if (d.$schema !== "https://schemas.agentskills.io/discovery/0.2.0/schema.json") return "bad $schema";
  for (const k of d.skills) {
    const body = Buffer.from(await (await get(new URL(k.url).pathname)).arrayBuffer());
    if (`sha256:${createHash("sha256").update(body).digest("hex")}` !== k.digest) return `digest mismatch: ${k.name}`;
  }
  return d.skills.length > 0 || "no skills";
});
await check("ard", async () => {
  const [d, r] = await json("/.well-known/ai-catalog.json");
  if (r.headers.get("access-control-allow-origin") !== "*") return "no CORS";
  return (d.specVersion && d.host?.identifier && d.entries.every((e) => e.identifier?.startsWith("urn:air:") && e.displayName && e.type && !!e.url !== !!e.data && e.representativeQueries?.length >= 2 && e.representativeQueries.length <= 5)) || "bad entries";
});
await check("webMcp", async () => {
  const html = await (await get("/")).text();
  return (/toolname="/.test(html) && /<script type="module"/.test(html)) || "no WebMCP form/script (full check needs a browser)";
});
await check("langRedirect", async () => (await get("/lang?to=ja")).headers.get("location")?.endsWith("/ja/") || "no redirect");

for (const [name, ok, why] of results) console.log(`${ok ? "pass" : "FAIL"}  ${name}${why ? `  (${why})` : ""}`);
console.log("(not checkable locally: dnsAid — needs the production domain; OAuth checks are intentionally skipped)");
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
