import { release } from "../../lib/agents";
export const GET = () => Response.json(release());
