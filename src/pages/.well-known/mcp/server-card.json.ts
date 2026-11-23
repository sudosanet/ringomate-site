import { SERVER, absolute } from "../../../lib/agents";
import { TOOLS } from "../../../../worker/tools";

export const GET = () =>
  Response.json({
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: SERVER,
    description: "Read-only facts about RingoMate: features, install steps, the latest release and system requirements, in English or Japanese.",
    documentationUrl: absolute("/llms.txt"),
    transport: { type: "streamable-http", endpoint: absolute("/mcp") },
    endpoint: absolute("/mcp"),
    capabilities: { tools: { listChanged: false } },
    authentication: { required: false },
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  });
