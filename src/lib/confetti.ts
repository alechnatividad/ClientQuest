import confetti from "canvas-confetti";

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Premium palette: gold, silver, emerald */
const COLORS = ["#F59E0B", "#E2E8F0", "#10B981"];

/** Burst centered on a DOM element (used by CTA buttons). */
export function burstFrom(el: Element): void {
  if (prefersReducedMotion()) return;
  const r = el.getBoundingClientRect();
  const origin = {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
  confetti({
    particleCount: 90,
    spread: 85,
    startVelocity: 38,
    origin,
    colors: COLORS,
    zIndex: 9999,
    ticks: 220,
    scalar: 0.9,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 45,
      spread: 110,
      startVelocity: 24,
      origin,
      colors: COLORS,
      zIndex: 9999,
      ticks: 200,
      scalar: 0.7,
    });
  }, 140);
}

/** Small celebratory pop at normalized viewport coordinates. */
export function smallBurstAt(x: number, y: number): void {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 42,
    spread: 70,
    startVelocity: 26,
    gravity: 1.1,
    origin: { x, y },
    colors: COLORS,
    zIndex: 9999,
    scalar: 0.75,
    ticks: 170,
  });
}

/** Full celebration — side cannons plus a center volley. */
export function cannons(): void {
  if (prefersReducedMotion()) return;
  const base = { colors: COLORS, zIndex: 9999, ticks: 260 };
  confetti({ ...base, particleCount: 70, angle: 60, spread: 62, startVelocity: 55, origin: { x: 0, y: 0.8 } });
  confetti({ ...base, particleCount: 70, angle: 120, spread: 62, startVelocity: 55, origin: { x: 1, y: 0.8 } });
  window.setTimeout(() => {
    confetti({ ...base, particleCount: 100, spread: 105, startVelocity: 40, origin: { x: 0.5, y: 0.65 } });
  }, 220);
}
