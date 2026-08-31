import { Archive, Flame, ScrollText, ShieldAlert, Swords, Trophy, type LucideIcon } from "lucide-react";
import type { Client, Project, ProjectStatus } from "../types/database";

/**
 * Quest engine — pure gamification derived ONLY from real workspace data.
 *
 * ClientQuest frames client work as a quest board. Rather than inventing
 * numbers, every point of XP, level, stage and achievement below is computed
 * from the authenticated user's actual `projects` and `clients` rows, so the
 * board can never lie about the state of the studio.
 */

/* ── XP economy ───────────────────────────────────────────────────────────── */

/** XP a project is worth, by its current status. */
export const QUEST_XP: Record<ProjectStatus, number> = {
  draft: 10,
  active: 25,
  waiting_review: 40,
  approved: 75,
  archived: 20,
};

/** XP a client relationship is worth. */
const CLIENT_XP_ACTIVE = 15;
const CLIENT_XP_ARCHIVED = 5;

/** Total studio XP from real rows. */
export function studioXp(projects: Project[], clients: Client[]): number {
  const fromProjects = projects.reduce((sum, p) => sum + QUEST_XP[p.status], 0);
  const fromClients = clients.reduce(
    (sum, c) => sum + (c.status === "active" ? CLIENT_XP_ACTIVE : CLIENT_XP_ARCHIVED),
    0,
  );
  return fromProjects + fromClients;
}

/* ── levels & ranks ───────────────────────────────────────────────────────── */

export interface StudioLevel {
  level: number;
  rank: string;
  totalXp: number;
  /** XP earned within the current level. */
  levelXp: number;
  /** XP needed to clear the current level. */
  levelSpan: number;
  /** 0..1 progress toward the next level. */
  progress: number;
  /** XP still needed to level up. */
  toNext: number;
}

const RANKS = [
  "Campfire Novice",
  "Quest Taker",
  "Party of One",
  "Guild Founder",
  "Realm Builder",
  "Legend of the Board",
];

/** XP required to reach the START of level `n` (1-indexed). Escalating curve. */
function levelStartXp(n: number): number {
  if (n <= 1) return 0;
  // 0, 100, 250, 450, 700, 1000, ...  (cumulative of 100,150,200,250,300...)
  let total = 0;
  for (let i = 1; i < n; i++) total += 100 + (i - 1) * 50;
  return total;
}

export function computeLevel(totalXp: number): StudioLevel {
  let level = 1;
  while (levelStartXp(level + 1) <= totalXp && level < 99) level++;

  const start = levelStartXp(level);
  const next = levelStartXp(level + 1);
  const span = next - start;
  const levelXp = totalXp - start;
  const progress = span > 0 ? Math.min(1, Math.max(0, levelXp / span)) : 1;

  return {
    level,
    rank: RANKS[Math.min(level - 1, RANKS.length - 1)],
    totalXp,
    levelXp,
    levelSpan: span,
    progress,
    toNext: Math.max(0, next - totalXp),
  };
}

/* ── quest stages (status → narrative) ────────────────────────────────────── */

export interface QuestStage {
  label: string;
  icon: LucideIcon;
  /** Tailwind text + tint for the stage chip. */
  chip: string;
  /** Accent used for the card's progress ring / glow. */
  ring: string;
}

export const QUEST_STAGE: Record<ProjectStatus, QuestStage> = {
  draft: {
    label: "Quest Logged",
    icon: ScrollText,
    chip: "border-slate-600/60 bg-slate-700/20 text-slate-300",
    ring: "text-slate-400",
  },
  active: {
    label: "In Progress",
    icon: Swords,
    chip: "border-violet-400/30 bg-quest/15 text-violet-300",
    ring: "text-[#8B5CF6]",
  },
  waiting_review: {
    label: "Boss Battle",
    icon: ShieldAlert,
    chip: "border-amber-400/30 bg-amber-400/10 text-[#F59E0B]",
    ring: "text-[#F59E0B]",
  },
  approved: {
    label: "Quest Complete",
    icon: Trophy,
    chip: "border-emerald-400/30 bg-emerald-400/10 text-[#10B981]",
    ring: "text-[#10B981]",
  },
  archived: {
    label: "Archived Tome",
    icon: Archive,
    chip: "border-slate-700 bg-slate-800/60 text-slate-500",
    ring: "text-slate-500",
  },
};

/** Fraction of a quest "complete" for the progress ring, by status. */
export const QUEST_PROGRESS: Record<ProjectStatus, number> = {
  draft: 0.12,
  active: 0.5,
  waiting_review: 0.75,
  approved: 1,
  archived: 1,
};

/* ── achievements (earned from real data only) ────────────────────────────── */

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  earned: boolean;
}

export function computeAchievements(projects: Project[], clients: Client[]): Achievement[] {
  const approved = projects.filter((p) => p.status === "approved").length;
  const activeClients = clients.filter((c) => c.status === "active").length;

  return [
    {
      id: "first-quest",
      title: "First Quest",
      desc: "Log your first project",
      icon: ScrollText,
      earned: projects.length >= 1,
    },
    {
      id: "client-magnet",
      title: "Client Magnet",
      desc: "Sign 3 active clients",
      icon: Flame,
      earned: activeClients >= 3,
    },
    {
      id: "ship-it",
      title: "Ship It",
      desc: "Get a project approved",
      icon: Trophy,
      earned: approved >= 1,
    },
    {
      id: "boss-slayer",
      title: "Boss Slayer",
      desc: "Win 3 boss battles (approvals)",
      icon: Swords,
      earned: approved >= 3,
    },
    {
      id: "full-party",
      title: "Full Party",
      desc: "Run 5 quests at once",
      icon: ShieldAlert,
      earned: projects.length >= 5,
    },
    {
      id: "realm-keeper",
      title: "Realm Keeper",
      desc: "See a quest through to the archive",
      icon: Archive,
      earned: projects.some((p) => p.status === "archived"),
    },
  ];
}

/* ── momentum ─────────────────────────────────────────────────────────────── */

/**
 * True when the studio touched something (created or updated a project or
 * client) within the last `days` days. Derived from real timestamps.
 */
export function hasRecentMomentum(projects: Project[], clients: Client[], days = 7): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const stamps = [
    ...projects.map((p) => p.updated_at),
    ...projects.map((p) => p.created_at),
    ...clients.map((c) => c.updated_at),
    ...clients.map((c) => c.created_at),
  ];
  return stamps.some((s) => new Date(s).getTime() >= cutoff);
}

/** Count of quests (projects) updated within the last `days` days. */
export function recentQuestCount(projects: Project[], days = 7): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return projects.filter((p) => new Date(p.updated_at).getTime() >= cutoff).length;
}
