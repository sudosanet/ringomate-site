import { install, requirements } from "../../lib/agents";
export const GET = () => Response.json({ en: { ...install("en"), ...requirements("en") }, ja: { ...install("ja"), ...requirements("ja") } });
