import { absolute } from "../../lib/agents";

export const GET = () =>
  new Response(
    JSON.stringify({
      linkset: [
        {
          anchor: absolute("/api/"),
          "service-desc": [{ href: absolute("/openapi.json"), type: "application/openapi+json" }],
          "service-doc": [{ href: absolute("/llms.txt"), type: "text/plain" }],
          status: [{ href: absolute("/api/status.json"), type: "application/json" }],
        },
        {
          anchor: absolute("/mcp"),
          "service-desc": [{ href: absolute("/.well-known/mcp/server-card.json"), type: "application/json" }],
          "service-doc": [{ href: absolute("/llms.txt"), type: "text/plain" }],
        },
      ],
    }),
    { headers: { "Content-Type": "application/linkset+json" } },
  );
