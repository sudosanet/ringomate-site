import type { SKILLS } from "./agents";

/** The SKILL.md artifact exactly as served (its sha256 goes into the discovery index). */
export const skillFile = (k: (typeof SKILLS)[number]) => `---\nname: ${k.name}\ndescription: ${k.description}\n---\n\n${k.body}`;
