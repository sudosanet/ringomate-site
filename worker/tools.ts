// Read-only MCP tools. The JSON Schemas are also published in /.well-known/mcp/server-card.json.
import { features, install, release, requirements } from "../src/lib/agents";
import type { Lang } from "../src/content/types";

const lang = { type: "object", properties: { lang: { type: "string", enum: ["en", "ja"], default: "en", description: "Answer language" } } } as const;
const pick = (args: Record<string, unknown> | undefined): Lang => (args?.lang === "ja" ? "ja" : "en");

export const TOOLS = [
  { name: "list_features", description: "List RingoMate's features, supported model and motion formats, and measured CPU/power numbers.", inputSchema: lang, run: (a?: Record<string, unknown>) => features(pick(a)) },
  { name: "get_install_steps", description: "Get the download link and install steps.", inputSchema: lang, run: (a?: Record<string, unknown>) => install(pick(a)) },
  { name: "get_latest_release", description: "Get the latest release link, license and privacy policy.", inputSchema: { type: "object", properties: {} }, run: () => release() },
  { name: "get_system_requirements", description: "Get the Mac and macOS versions RingoMate needs.", inputSchema: lang, run: (a?: Record<string, unknown>) => requirements(pick(a)) },
] as const;
