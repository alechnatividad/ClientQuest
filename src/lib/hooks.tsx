import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useUtcClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} UTC`;
}

export interface LiveMetrics {
  p95: number;
  errRate: number;
  rpm: number;
  /** 0..1 progress toward the next poll */
  phase: number;
  lastPoll: number; // epoch ms
}

const POLL_MS = 2400;

export function useLiveMetrics(): LiveMetrics {
  const [m, setM] = useState<LiveMetrics>({
    p95: 214,
    errRate: 0.042,
    rpm: 48.3,
    phase: 0,
    lastPoll: Date.now(),
  });

  useEffect(() => {
    const jitter = (base: number, spread: number) =>
      base + (Math.random() - 0.5) * spread;
    const poll = setInterval(() => {
      setM((prev) => ({
        p95: Math.round(Math.min(289, Math.max(176, jitter(prev.p95, 30)))),
        errRate: Math.min(0.14, Math.max(0.012, jitter(prev.errRate, 0.02))),
        rpm: Math.min(54.9, Math.max(43.2, jitter(prev.rpm, 2.4))),
        phase: 0,
        lastPoll: Date.now(),
      }));
    }, POLL_MS);
    const frame = setInterval(() => {
      setM((prev) => ({
        ...prev,
        phase: Math.min(1, (Date.now() - prev.lastPoll) / POLL_MS),
      }));
    }, 120);
    return () => {
      clearInterval(poll);
      clearInterval(frame);
    };
  }, []);

  return m;
}

/* ---------------- scroll reveal ---------------- */

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

export function Reveal({ children, delay = 0, className = "", as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ ["--rd" as never]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ---------------- section heading ---------------- */

export function SectionHead({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note?: string;
}) {
  return (
    <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[11px] tracking-[0.3em] text-dim uppercase">
          <span className="text-ok">{index}</span>
          <span className="mx-2 text-edgehi">/</span>
          {note ?? "telemetry"}
        </p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-wide text-snow uppercase sm:text-3xl">
          {title}
        </h2>
      </div>
      <div className="hidden h-px flex-1 self-end bg-gradient-to-r from-edgehi to-transparent sm:block" />
    </Reveal>
  );
}

/* ---------------- status chip ---------------- */

export function StatusChip({ tone, label }: { tone: "ok" | "warn" | "crit" | "info"; label: string }) {
  const map = {
    ok: "border-ok/40 bg-ok/10 text-ok",
    warn: "border-warn/40 bg-warn/10 text-warn",
    crit: "border-crit/40 bg-crit/10 text-crit",
    info: "border-glow/40 bg-glow/10 text-glow",
  } as const;
  const dot = { ok: "bg-ok", warn: "bg-warn", crit: "bg-crit", info: "bg-glow" } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.14em] uppercase ${map[tone]}`}
    >
      <span className={`h-1.5 w-1.5 ${dot[tone]}`} />
      {label}
    </span>
  );
}

/* stable memo helper */
export function useMemoized<T>(factory: () => T, deps: unknown[]): T {
  return useMemo(factory, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useInterval(cb: () => void, ms: number | null) {
  const saved = useRef(cb);
  useEffect(() => {
    saved.current = cb;
  }, [cb]);
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
