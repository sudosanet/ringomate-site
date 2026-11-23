import { SERVER, absolute } from "../lib/agents";

const json = (description: string) => ({ "200": { description, content: { "application/json": { schema: { type: "object" } } } } });

export const GET = () =>
  Response.json({
    openapi: "3.1.0",
    info: { title: "RingoMate site API", version: SERVER.version, description: "Read-only facts about RingoMate, a free 3D desktop mascot for Macs with Apple silicon. No authentication." },
    servers: [{ url: absolute("/") }],
    paths: {
      "/api/features.json": { get: { operationId: "getFeatures", summary: "Features, supported formats and measured numbers (en and ja)", responses: json("Features by language") } },
      "/api/install.json": { get: { operationId: "getInstall", summary: "Download link, install steps and system requirements (en and ja)", responses: json("Install info by language") } },
      "/api/release.json": { get: { operationId: "getRelease", summary: "Latest release link, license and privacy policy", responses: json("Release info") } },
      "/api/status.json": { get: { operationId: "getStatus", summary: "Health check", responses: json("Always ok") } },
    },
  });
