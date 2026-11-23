// Numbers that count up, the self-typing Claude Code terminal, and WebMCP tools.
import { DOWNLOAD } from "../content/links";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const whenSeen = (el: Element, fn: () => void, threshold = 0.4) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { threshold });
  io.observe(el);
};

if (!reduce) {
  for (const el of document.querySelectorAll<HTMLElement>("[data-count]")) {
    const to = Number(el.dataset.count), digits = el.dataset.count!.split(".")[1]?.length ?? 0;
    el.textContent = (0).toFixed(digits);
    whenSeen(el, () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 1100), eased = 1 - (1 - k) ** 3;
        el.textContent = (to * eased).toFixed(digits);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // Thinking → running a tool → needs approval → done, on a loop while the section is on screen.
  const term = document.querySelector<HTMLElement>("[data-term]");
  const chips = document.querySelector<HTMLElement>("[data-chips]");
  if (term && chips) {
    term.classList.add("playing");
    chips.classList.add("playing");
    let i = -1, timer = 0;
    const show = (k: number) => {
      term.querySelectorAll<HTMLElement>("[data-step]").forEach((p) => p.classList.toggle("on", Number(p.dataset.step) <= k));
      chips.querySelectorAll(".state").forEach((c, j) => c.classList.toggle("on", j === k));
      dispatchEvent(new CustomEvent("claude-state", { detail: k }));
    };
    const next = () => { i = (i + 1) % 4; show(i); timer = window.setTimeout(next, i === 3 ? 3200 : 1900); };
    new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting) { i = -1; next(); }
    }, { threshold: 0.5 }).observe(term);
  }
}

// WebMCP (https://webmcp.org/): expose the page's key actions to in-browser agents.
type Tool = { name: string; description: string; inputSchema: object; execute: (args: Record<string, unknown>) => Promise<unknown> };
type ModelContext = { registerTool(t: Tool, options?: { signal?: AbortSignal }): Promise<unknown> };
const mc =
  (document as Document & { modelContext?: ModelContext }).modelContext ?? (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
if (mc) {
  const signal = new AbortController().signal; // tools live as long as the page
  const lang = document.documentElement.lang;
  const text = (t: string) => ({ content: [{ type: "text", text: t }] });
  void mc.registerTool({
    name: "get_download_link",
    description: "Get the download link for the latest RingoMate release (a dmg for Macs with Apple silicon, macOS 27 or later).",
    inputSchema: { type: "object", properties: {} },
    execute: async () => text(DOWNLOAD),
  }, { signal });
  void mc.registerTool({
    name: "switch_language",
    description: "Show this site in English or Japanese.",
    inputSchema: { type: "object", properties: { to: { type: "string", enum: ["en", "ja"] } }, required: ["to"] },
    execute: async ({ to }) => {
      if (to !== lang) location.href = to === "ja" ? "/ja/" : "/";
      return text(`Switched to ${to}`);
    },
  }, { signal });
}
