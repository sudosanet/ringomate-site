import { SKILLS } from "../../../../lib/agents";
import { skillFile } from "../../../../lib/skills";

export const getStaticPaths = () => SKILLS.map((k) => ({ params: { name: k.name } }));
export const GET = ({ params }: { params: { name: string } }) =>
  new Response(skillFile(SKILLS.find((k) => k.name === params.name)!), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
