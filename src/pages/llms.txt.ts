import { SKILLS, absolute } from "../lib/agents";
import { DOWNLOAD, REPO, sites } from "../content";

export const GET = () => {
  const s = sites.en;
  const body = `# RingoMate

> ${s.meta.description}

RingoMate puts a 3D character on the desktop of a Mac with Apple silicon (macOS 27 or later). It loads PMX, PMD, VRM, GLB and FBX models,
dances to whatever is playing, talks with on-device AI and a Japanese voice, reads notifications aloud when allowed, and reacts to Claude Code.
Screen, sound and conversations never leave the Mac. Free, Apache-2.0.

## Pages

- [Home (English, Markdown)](${absolute("/index.md")}): every feature, measured numbers, install steps
- [Home (Japanese, Markdown)](${absolute("/ja/index.md")})
- [Download the latest release](${DOWNLOAD})
- [Source code](${REPO})

## For agents

- [MCP server](${absolute("/mcp")}): read-only tools (list_features, get_install_steps, get_latest_release, get_system_requirements); card at ${absolute("/.well-known/mcp/server-card.json")}
- [OpenAPI](${absolute("/openapi.json")}): ${["features", "install", "release", "status"].map((n) => `/api/${n}.json`).join(", ")}
${SKILLS.map((k) => `- [Skill: ${k.name}](${absolute(`/.well-known/agent-skills/${k.name}/SKILL.md`)}): ${k.description}`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
