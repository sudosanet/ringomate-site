// The page as Markdown, built from the same data as the HTML. Served at /index.md, /ja/index.md and for Accept: text/markdown.
import { DOWNLOAD, LICENSE, PRIVACY, REPO, SITE, TSUKUYOMI_TERMS, pathFor, sites, type Lang } from "../content";

export function pageMarkdown(lang: Lang): string {
  const s = sites[lang];
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  const ja = lang === "ja";
  return `# RingoMate

> ${s.hero.lines.join("")} ${s.hero.sub}. ${s.hero.badges.join(" · ")}.

- ${s.ui.download}: ${DOWNLOAD}
- ${s.footer.source}: ${REPO}
- ${ja ? "English" : "日本語"}: ${new URL(pathFor(ja ? "en" : "ja"), SITE).href}

## ${s.features.title}

${list(s.features.items.map((f) => f.label))}

## ${s.models.title}

${s.models.lead}

- ${s.models.model.title}: ${s.models.model.exts.join(", ")} (${s.models.model.note})
- ${s.models.motion.title}: ${s.models.motion.exts.join(", ")}
- ${s.models.analyze.title}: ${s.models.analyze.steps.map((x) => x.text).join(", ")}. ${s.models.analyze.note}
- ${s.models.moves.title}: ${s.models.moves.steps.map((x) => x.text).join(", ")}. ${s.models.moves.note}

## ${s.dance.title}

${s.dance.lead}

${list(s.dance.steps.map((x) => `${x.title}: ${x.sub}`))}

${s.dance.note}

## ${s.props.title} / ${s.props.touchTitle}

- ${s.props.sub}
- ${s.props.touchSub}

## ${s.talk.title}

${s.talk.lead}

${s.talk.steps.map((x, i) => `${i + 1}. ${x.title}: ${x.sub}`).join("\n")}

## ${s.notice.title}

${s.notice.note}. ${ja ? "例" : "Example"}: "${s.notice.bubble}"

## ${s.voice.title}

${s.voice.lead}

- ${ja ? "プリセット" : "Presets"}: ${s.voice.presets.map((p) => p.label).join(", ")}
${list(s.voice.create.map((c) => `${c.title}: ${c.sub} (${c.example})`))}

${s.voice.note}

## ${s.more.title}

${list(s.more.items.map((x) => `${x.title}: ${x.sub}`))}

## ${s.privacy.title}

${s.privacy.lead} ${s.privacy.note}. ${s.footer.privacy}: ${PRIVACY}

## ${s.engine.title}

${list(s.engine.ne.map((x) => `Neural Engine: ${x.text} (${x.tag})`))}
- GPU: ${s.engine.gpu.title} (${s.engine.gpu.sub})
- CPU: ${s.engine.cpu.title} (${s.engine.cpu.sub})

## ${s.numbers.title}

${s.numbers.lead}

| ${ja ? "項目" : "Measure"} | ${ja ? "値" : "Value"} |
|---|---|
${s.numbers.items.map((f) => `| ${f.label} | ${f.value} ${f.unit} |`).join("\n")}

## ${s.claude.title}

${s.claude.lead} ${s.claude.states.map((x) => x.label).join(" → ")}. ${s.claude.note}. ${s.claude.plugin}.

## ${s.install.title}

${list(s.install.requirements)}

${s.install.steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}

${s.install.note}

## ${ja ? "ライセンスとクレジット" : "License and credits"}

- ${s.footer.license} (${LICENSE})
${list(s.footer.credits)}
- ${s.footer.terms}: ${TSUKUYOMI_TERMS}
`;
}
