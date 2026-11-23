// Wires the page to the mascot: the section in the middle of the screen picks her act and line,
// buttons with data-prop / data-voice / data-claude talk to her directly.
import type { Mascot } from "./mascot";
import type { Act } from "./poses";
import type { PropKind } from "./props";

export function mountStage() {
  const stage = document.querySelector<HTMLElement>("[data-stage]");
  const bubble = document.querySelector<HTMLElement>("[data-say]");
  if (!stage || !bubble || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const pats: string[] = JSON.parse(stage.dataset.pats ?? "[]");

  const go = async () => {
    let m: Mascot;
    try {
      const { start } = await import("./mascot");
      m = await start(stage.querySelector("canvas")!, bubble);
    } catch (err) {
      console.warn("[mascot] staying on the still image:", err);
      return;
    }
    stage.classList.add("ready");
    (window as unknown as { mascot?: Mascot }).mascot = m.debug ? m : undefined;

    let current: HTMLElement | null = null, chatter = 0, n = 0;
    const talk = (s: HTMLElement) => {
      const lines: string[] = s.dataset.say ? JSON.parse(s.dataset.say) : [];
      if (lines.length) m.say(lines[n++ % lines.length]);
    };
    const enter = (s: HTMLElement) => {
      if (s === current) return;
      current = s;
      m.act((s.dataset.act as Act) ?? "idle");
      m.hold((s.dataset.hold as PropKind) || null);
      n = 0;
      talk(s);
      // Keep chatting while the section stays: the next line every 7 s.
      clearInterval(chatter);
      chatter = window.setInterval(() => current && !document.hidden && talk(current), 7000);
    };
    // The section crossing the middle line of the viewport is the current one.
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && enter(e.target as HTMLElement)), { rootMargin: "-50% 0px -50% 0px" });
    document.querySelectorAll<HTMLElement>("[data-act]").forEach((s) => io.observe(s));

    stage.querySelector("canvas")!.addEventListener("click", () => {
      m.jump();
      setTimeout(burst, 250);
      m.say(pats[Math.floor(Math.random() * pats.length)], 1600);
    });
    document.querySelectorAll<HTMLButtonElement>("[data-prop]").forEach((b) =>
      b.addEventListener("click", () => {
        m.hold(b.dataset.prop as PropKind);
        m.say(b.dataset.line!);
        mark(b);
      }));
    document.querySelectorAll<HTMLButtonElement>("[data-voice]").forEach((b) =>
      b.addEventListener("click", () => {
        const v = Number(b.dataset.voice);
        m.act((["cheer", "voice", "idle", "cheer"] as Act[])[v]);
        if (v === 0 || v === 3) m.hop();
        m.say(b.dataset.line!);
        mark(b);
      }));
    addEventListener("claude-state", (e) => {
      const i = (e as CustomEvent<number>).detail;
      if (current?.id !== "claude") return;
      m.act((["think", "talk", "notice", "cheer"] as Act[])[i]);
      if (i === 3) m.hop();
      const lines: string[] = JSON.parse(current.dataset.states ?? "[]");
      m.say(lines[i], 1500);
    });
  };
  // Hearts and sparkles that pop out of her head when she jumps.
  const burst = () => {
    const x = parseFloat(bubble.style.getPropertyValue("--x")), y = parseFloat(bubble.style.getPropertyValue("--y")) + 40;
    for (let i = 0; i < 9; i++) {
      const p = document.createElement("i");
      p.className = "burst";
      p.textContent = ["♥", "✦", "♪"][i % 3];
      p.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.random() - 0.5) * 220}px;--dy:${-90 - Math.random() * 130}px;--r:${(Math.random() - 0.5) * 120}deg;color:${["#FF5C9D", "#FFC44D", "#6A9BE0", "#FF8FBE"][i % 4]};animation-delay:${i * 25}ms`;
      document.body.append(p);
      p.addEventListener("animationend", () => p.remove());
    }
  };
  const mark = (b: HTMLElement) => b.parentElement?.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));

  // Start after the first paint so the model never delays the page.
  if ("requestIdleCallback" in window) requestIdleCallback(() => void go(), { timeout: 1500 });
  else setTimeout(() => void go(), 300);
}
