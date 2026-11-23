import { SKILLS, absolute } from "../../lib/agents";

const host = new URL(absolute("/")).host;
const urn = (ns: string, name: string) => `urn:air:${host}:${ns}:${name}`;

export const GET = () =>
  Response.json({
    specVersion: "1.0",
    host: { displayName: "RingoMate", identifier: `did:web:${host}` },
    entries: [
      {
        identifier: urn("server", "ringomate"),
        displayName: "RingoMate facts (MCP)",
        type: "application/mcp-server-card+json",
        url: absolute("/.well-known/mcp/server-card.json"),
        representativeQueries: ["what can the RingoMate desktop mascot do", "how do I install RingoMate on my Mac", "which 3D model formats does RingoMate load"],
      },
      {
        identifier: urn("api", "ringomate"),
        displayName: "RingoMate facts (OpenAPI)",
        type: "application/openapi+json",
        url: absolute("/openapi.json"),
        representativeQueries: ["latest RingoMate release download", "RingoMate CPU and power usage", "RingoMate system requirements"],
      },
      ...SKILLS.map((k) => ({
        identifier: urn("skill", k.name),
        displayName: k.name,
        type: "text/markdown",
        url: absolute(`/.well-known/agent-skills/${k.name}/SKILL.md`),
        representativeQueries: [k.description, k.name.replaceAll("-", " ")],
      })),
      {
        identifier: urn("doc", "llms"),
        displayName: "RingoMate summary for LLMs",
        type: "text/plain",
        url: absolute("/llms.txt"),
        representativeQueries: ["what is RingoMate", "is RingoMate free and open source"],
      },
    ],
  });
