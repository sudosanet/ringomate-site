import { pageMarkdown } from "../lib/markdown";
export const GET = () => new Response(pageMarkdown("en"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
