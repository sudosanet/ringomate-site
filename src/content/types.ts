export const LANGS = ["en", "ja"] as const;
export type Lang = (typeof LANGS)[number];

/** Phosphor icon name (fill weight). */
export type Icon = string;
export type Item = { icon: Icon; title: string; sub: string };
export type Fact = { icon: Icon; value: string; unit: string; label: string };

export type Site = {
  lang: Lang;
  meta: { title: string; description: string; ogAlt: string };
  ui: {
    download: string;
    downloadSub: string;
    otherLang: string;
    skip: string;
    nav: { features: string; install: string; agents: string };
    mascotAlt: string;
    mascotHint: string;
    tryVoice: string;
    tryProp: string;
  };
  hero: { lines: [string, string, string]; sub: string; badges: string[] };
  features: { title: string; items: { icon: Icon; label: string; href: string }[] };
  models: {
    title: string;
    lead: string;
    model: { title: string; exts: string[]; note: string };
    motion: { title: string; exts: string[] };
    analyze: { title: string; steps: { icon: Icon; text: string }[]; note: string };
    moves: { title: string; steps: { icon: Icon; text: string }[]; note: string };
  };
  dance: { title: string; lead: string; steps: Item[]; result: string; note: string };
  props: { title: string; sub: string; touchTitle: string; touchSub: string; items: { id: "balloon" | "mug" | "book"; icon: Icon; label: string; line: string }[] };
  talk: { title: string; lead: string; steps: Item[] };
  notice: { title: string; banner: { app: string; text: string }; ai: { title: string; sub: string }; bubble: string; note: string };
  voice: {
    title: string;
    lead: string;
    presets: { icon: Icon; label: string; line: string }[];
    createTitle: string;
    create: { icon: Icon; title: string; example: string; sub: string }[];
    note: string;
  };
  more: { title: string; items: Item[] };
  privacy: { title: string; lead: string; inputs: { icon: Icon; label: string }[]; mac: string; steps: { icon: Icon; label: string }[]; react: string; out: string; note: string };
  engine: { title: string; lead: string; ne: { icon: Icon; text: string; tag: string }[]; gpu: { title: string; sub: string }; cpu: { title: string; sub: string } };
  numbers: { title: string; lead: string; items: Fact[] };
  claude: { title: string; lead: string; prompt: string; lines: string[]; ask: string; ok: string; states: { icon: Icon; label: string }[]; note: string; plugin: string };
  install: { title: string; requirements: string[]; steps: string[]; note: string; source: string };
  /** What the mascot says as each section comes into view. */
  lines: { hello: string; features: string; models: string; dance: string; talk: string[]; privacy: string; engine: string; numbers: string; claude: string[]; install: string; pat: string[] };
  agents: { title: string; lead: string; items: { label: string; href: string; sub: string }[] };
  footer: { tagline: string; free: string; license: string; credits: string[]; terms: string; privacy: string; source: string };
};
