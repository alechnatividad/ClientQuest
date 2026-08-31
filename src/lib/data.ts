/* ------------------------------------------------------------------ */
/*  Simulated telemetry model for the Qwen Coder status board.         */
/*  All numbers are generated locally — nothing here is real traffic.  */
/* ------------------------------------------------------------------ */

export type DayState = "ok" | "partial" | "down";

export interface ServiceComponent {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  /** 90 entries, oldest first */
  days: DayState[];
}

export interface IncidentUpdate {
  at: string;
  state: "investigating" | "identified" | "monitoring" | "resolved";
  note: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "minor" | "major" | "maintenance";
  affected: string[];
  date: string;
  resolved: boolean;
  updates: IncidentUpdate[];
}

export interface RegionInfo {
  id: string;
  name: string;
  code: string;
  base: number; // nominal RTT in ms
}

/* deterministic PRNG so the board is stable between reloads */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

export function dayLabel(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * DAY);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function uptimePct(days: DayState[]): number {
  const weight: Record<DayState, number> = { ok: 1, partial: 0.68, down: 0.04 };
  const sum = days.reduce((acc, d) => acc + weight[d], 0);
  return (sum / days.length) * 100;
}

function buildDays(seed: number, hits: Partial<Record<number, DayState>>): DayState[] {
  const rnd = mulberry32(seed);
  const days: DayState[] = Array.from({ length: 90 }, () => {
    const r = rnd();
    if (r > 0.993) return "partial"; // rare blip
    return "ok";
  });
  // always keep today + yesterday clean
  days[88] = "ok";
  days[89] = "ok";
  for (const [idx, state] of Object.entries(hits)) {
    if (state) days[Number(idx)] = state;
  }
  return days;
}

export const COMPONENTS: ServiceComponent[] = [
  {
    id: "completion",
    name: "Code Completion API",
    endpoint: "POST /v1/completions",
    region: "global edge",
    days: buildDays(11, { 64: "partial", 65: "partial" }),
  },
  {
    id: "chat",
    name: "Chat & Reasoning API",
    endpoint: "POST /v1/chat/completions",
    region: "global edge",
    days: buildDays(23, { 79: "down", 78: "partial" }),
  },
  {
    id: "embed",
    name: "Embeddings & Rerank",
    endpoint: "POST /v1/embeddings",
    region: "ap-southeast",
    days: buildDays(37, {}),
  },
  {
    id: "console",
    name: "Web Console",
    endpoint: "console.qwen.example",
    region: "multi-region",
    days: buildDays(41, { 33: "partial" }),
  },
  {
    id: "keys",
    name: "API Keys & Billing",
    endpoint: "auth / metering",
    region: "multi-region",
    days: buildDays(53, {}),
  },
  {
    id: "webhooks",
    name: "Webhook Delivery",
    endpoint: "events → customer URLs",
    region: "eu-central",
    days: buildDays(67, { 43: "partial", 42: "partial" }),
  },
];

export const REGIONS: RegionInfo[] = [
  { id: "hgh", name: "Hangzhou", code: "cn-hangzhou", base: 24 },
  { id: "sgp", name: "Singapore", code: "ap-southeast-1", base: 39 },
  { id: "tyo", name: "Tokyo", code: "ap-northeast-1", base: 46 },
  { id: "jkt", name: "Jakarta", code: "ap-southeast-5", base: 58 },
  { id: "fra", name: "Frankfurt", code: "eu-central-1", base: 64 },
  { id: "iad", name: "N. Virginia", code: "us-east-1", base: 91 },
];

export const INCIDENTS: Incident[] = [
  {
    id: "INC-2214",
    title: "Elevated 5xx on Chat & Reasoning API (ap-southeast)",
    severity: "major",
    affected: ["Chat & Reasoning API"],
    date: dayLabel(11),
    resolved: true,
    updates: [
      {
        at: "03:12 UTC",
        state: "investigating",
        note: "Error budget burn detected — 5xx rate on chat completions climbing past 4% in ap-southeast-1.",
      },
      {
        at: "03:31 UTC",
        state: "identified",
        note: "Traced to a saturated inference shard group after the qwen-coder-latest rollout. Traffic being shed to healthy shards.",
      },
      {
        at: "04:02 UTC",
        state: "monitoring",
        note: "Rollback of the shard scheduler completed. Error rate below 0.3% and falling.",
      },
      {
        at: "04:47 UTC",
        state: "resolved",
        note: "All regions back to baseline p95. A rollout canary gate has been tightened from 25% to 5%.",
      },
    ],
  },
  {
    id: "INC-2209",
    title: "Completion latency spike during model rollout",
    severity: "minor",
    affected: ["Code Completion API"],
    date: dayLabel(26),
    resolved: true,
    updates: [
      {
        at: "11:20 UTC",
        state: "investigating",
        note: "p95 for /v1/completions drifted from ~210ms to ~640ms worldwide.",
      },
      {
        at: "11:52 UTC",
        state: "identified",
        note: "New weight shard warming cache on cold starts. Pre-warming added to the deploy pipeline.",
      },
      {
        at: "12:35 UTC",
        state: "resolved",
        note: "Latency back within SLO for 30 minutes. No requests were lost.",
      },
    ],
  },
  {
    id: "INC-2197",
    title: "Delayed key rotation propagations",
    severity: "minor",
    affected: ["API Keys & Billing"],
    date: dayLabel(47),
    resolved: true,
    updates: [
      {
        at: "08:05 UTC",
        state: "identified",
        note: "Rotated API keys kept working past their revocation window due to an edge cache TTL bug.",
      },
      {
        at: "09:40 UTC",
        state: "resolved",
        note: "Cache purge completed across all PoPs; rotation now propagates in <15s as designed.",
      },
    ],
  },
  {
    id: "MNT-0142",
    title: "Scheduled · Embeddings cluster migration to v3 storage",
    severity: "maintenance",
    affected: ["Embeddings & Rerank"],
    date: dayLabel(-3),
    resolved: false,
    updates: [
      {
        at: "planned 02:00–03:30 UTC",
        state: "monitoring",
        note: "Read traffic will be served from replicas; brief 30s pause possible for writes. No action required.",
      },
    ],
  },
];

export interface WireEntry {
  t: string;
  target: string;
  value: string;
  state: "OK" | "SLOW" | "INFO";
}

export function buildWire(): WireEntry[] {
  const rnd = mulberry32(99);
  const now = Date.now();
  const targets = [
    "completion/v1",
    "chat/v1",
    "embeddings/v1",
    "keys/rotate",
    "webhooks/deliver",
    "console/auth",
  ];
  const out: WireEntry[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now - i * (140_000 + rnd() * 160_000));
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    const roll = rnd();
    out.push({
      t: `${hh}:${mm}:${ss}Z`,
      target: targets[Math.floor(rnd() * targets.length)],
      value: roll > 0.82 ? "queued" : `p95 ${Math.round(180 + rnd() * 90)}ms`,
      state: roll > 0.9 ? "SLOW" : roll > 0.82 ? "INFO" : "OK",
    });
  }
  return out;
}

/* latency series for the chart */
export interface RangeDef {
  id: string;
  label: string;
  points: number;
  step: string;
  base: number;
  vol: number;
  seed: number;
}

export const RANGES: RangeDef[] = [
  { id: "live", label: "LIVE", points: 60, step: "2s", base: 212, vol: 16, seed: 7 },
  { id: "24h", label: "24H", points: 72, step: "20m", base: 226, vol: 34, seed: 19 },
  { id: "7d", label: "7D", points: 84, step: "2h", base: 238, vol: 46, seed: 31 },
];

export function genSeries(def: RangeDef): number[] {
  const rnd = mulberry32(def.seed);
  const out: number[] = [];
  let v = def.base;
  for (let i = 0; i < def.points; i++) {
    v += (rnd() - 0.5) * def.vol;
    v = Math.max(def.base * 0.72, Math.min(def.base * 1.45, v));
    out.push(Math.round(v));
  }
  return out;
}

export function nextTick(def: RangeDef, last: number): number {
  const v = last + (Math.random() - 0.5) * def.vol;
  return Math.round(Math.max(def.base * 0.72, Math.min(def.base * 1.45, v)));
}

export function percentiles(series: number[]) {
  const s = [...series].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { p50: q(0.5), p95: q(0.95), p99: q(0.99) };
}
