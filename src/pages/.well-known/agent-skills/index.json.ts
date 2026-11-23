import { createHash } from "node:crypto";
import { SKILLS, absolute } from "../../../lib/agents";
import { skillFile } from "../../../lib/skills";

export const GET = () =>
  Response.json({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: SKILLS.map((k) => ({
      name: k.name,
      type: "skill-md",
      description: k.description,
      url: absolute(`/.well-known/agent-skills/${k.name}/SKILL.md`),
      digest: `sha256:${createHash("sha256").update(skillFile(k)).digest("hex")}`,
    })),
  });
