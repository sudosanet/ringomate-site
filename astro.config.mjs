import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export const SITE = "https://ringomate.sudosan.net";

export default defineConfig({
  site: SITE,
  trailingSlash: "ignore",
  i18n: { locales: ["en", "ja"], defaultLocale: "en", routing: { prefixDefaultLocale: false } },
  integrations: [sitemap({ i18n: { defaultLocale: "en", locales: { en: "en", ja: "ja" } } })],
  vite: { plugins: [tailwindcss()] },
});
