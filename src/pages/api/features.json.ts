import { features } from "../../lib/agents";
export const GET = () => Response.json({ en: features("en"), ja: features("ja") });
