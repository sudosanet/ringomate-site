// Machine-readable descriptions shared by the static files (/api, /openapi.json, /.well-known/*) and the MCP server in worker/.
import { DOWNLOAD, LICENSE, MIN_OS, PRIVACY, RELEASES, REPO, SITE, sites, type Lang } from "../content";

export const SERVER = { name: "ringomate-site", title: "RingoMate", version: "1.0.0" };

export const features = (lang: Lang) => {
  const s = sites[lang];
  return {
    highlights: s.features.items.map((f) => f.label),
    models: { formats: s.models.model.exts, motions: s.models.motion.exts },
    sections: [s.models, s.dance, s.talk, s.voice].map((x) => ({ title: x.title, summary: x.lead })),
    more: s.more.items,
    measured: s.numbers.items.map(({ label, value, unit }) => ({ label, value: Number(value), unit })),
  };
};

export const requirements = (lang: Lang) => ({ requirements: sites[lang].install.requirements, minimumOS: MIN_OS, chip: "Apple silicon" });

export const install = (lang: Lang) => ({
  download: DOWNLOAD,
  steps: sites[lang].install.steps,
  note: sites[lang].install.note,
  source: REPO,
});

export const release = () => ({ latest: RELEASES, repository: REPO, license: "Apache-2.0", licenseUrl: LICENSE, privacy: PRIVACY, price: 0 });

export const SKILLS = [
  {
    name: "install-ringomate",
    description: "Install RingoMate, a free 3D desktop mascot for Macs with Apple silicon.",
    body: `# Install RingoMate

RingoMate is a free, open-source (Apache-2.0) 3D desktop mascot for Macs with Apple silicon running ${MIN_OS} or later.

1. Download the latest dmg: ${DOWNLOAD}
2. Open it and drag \`RingoMate.app\` into \`/Applications\`.
3. Open RingoMate. The app is notarized by Apple. It asks for Screen Recording (to hear what is playing and see the front window); everything stays on the Mac.

It downloads only the voice model, about 300 MB of assets on first launch, and updates (it updates itself). Privacy policy: ${PRIVACY}
`,
  },
  {
    name: "connect-claude-code",
    description: "Connect RingoMate to Claude Code so the mascot reacts to the session (thinking, running a tool, needs approval, done) and can speak or gesture over MCP.",
    body: `# Connect RingoMate to Claude Code

RingoMate ships a Claude Code plugin inside the app. It installs hooks that send the session state
to the running app over a local socket, and an MCP server that lets Claude ask the mascot to say a line or do a gesture.
The plugin is read from the app, so updating the app updates the plugin.

1. Install and open RingoMate (see the \`install-ringomate\` skill).
2. In RingoMate's Settings, open the AI tab and click Install Plugin under Claude Code. Or run:

   \`\`\`sh
   claude plugin marketplace add /Applications/RingoMate.app/Contents/Resources/claude-plugin
   claude plugin install ringomate@ringomate
   \`\`\`

3. Start a new session. The mascot shows: thinking → running a tool → needs approval → done.

Nothing leaves the Mac: hooks and MCP talk to the app on the same machine only.
`,
  },
] as const;

export const absolute = (path: string) => new URL(path, SITE).href;
