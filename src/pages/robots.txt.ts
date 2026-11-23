import { absolute } from "../lib/agents";

const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"];

export const GET = () =>
  new Response(
    `# RingoMate is a free, open-source app. Search, AI answers and AI training are all welcome.
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

${AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

Sitemap: ${absolute("/sitemap-index.xml")}
Agentmap: ${absolute("/.well-known/ai-catalog.json")}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
