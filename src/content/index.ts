import { en } from "./en";
import { ja } from "./ja";
import type { Lang, Site } from "./types";

export const sites: Record<Lang, Site> = { en, ja };
export const pathFor = (lang: Lang) => (lang === "en" ? "/" : `/${lang}/`);
export const mdPathFor = (lang: Lang) => (lang === "en" ? "/index.md" : `/${lang}/index.md`);
export * from "./types";
export * from "./links";
