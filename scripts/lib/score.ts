// Score = priorityScore + recencyScore + importanceScore
// Recency dominates (exponential decay, 48h half-life). Importance is
// recency-gated so old posts cannot rank on keyword hits alone.

import type { Article } from "../types";
import type { Priority } from "../sources";

const HOUR_MS = 60 * 60 * 1000;

export interface ScoreCtx {
  now: Date;
  forCategoryId?: string;
  isHomeCategory?: boolean;
}

export const PRIORITY_SCORE: Record<Priority, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 4,
};

export function priorityScore(priority: Priority): number {
  return PRIORITY_SCORE[priority] ?? 0;
}

export function ageHours(publishedAt: string | null, now: Date): number {
  if (!publishedAt) return 36;
  const t = new Date(publishedAt).getTime();
  if (isNaN(t)) return 36;
  return Math.max(0, (now.getTime() - t) / HOUR_MS);
}

const HALF_LIFE_H = 48;
export function recencyScore(publishedAt: string | null, now: Date): number {
  const h = ageHours(publishedAt, now);
  return Math.max(2, 100 * Math.pow(0.5, h / HALF_LIFE_H));
}

const IMPORTANCE_FAITH = [
  "revival", "missionary", "missionaries", "translation", "martyr",
  "persecution", " sbc ", "gospel",
  "scripture", "church plant", "seminary", "ordination", "baptism",
];
const IMPORTANCE_EVENT = [
  "archbishop", "bishop", "pastor", "congregation",
  "religious liberty", "first amendment", "holy land", "jerusalem",
];

// Soften Catholic-institution feeds without dropping them. Recency still
// lets a major Vatican story surface; it just will not outrank a same-age
// TGC / CT / RNS item on priority + keyword hits alone.
const CATHOLIC_SOURCE_DAMPEN = new Set([
  "Vatican News",
  "Catholic News Agency",
  "America Magazine",
  "The Pillar",
  "OSV News",
  "Crux",
  "Aleteia",
]);
const CATHOLIC_SOURCE_PENALTY = 10;
const IMPORTANCE_SERVICE = [
  "church plant", "relief", "refugee", "adoption", "prison ministry",
  "homeless", "unreached",
];

function contains(haystack: string, needles: string[]): number {
  let hits = 0;
  for (const n of needles) if (haystack.includes(n)) hits++;
  return hits;
}

export function importanceScore(
  title: string,
  summary: string | null,
  ageH: number,
): number {
  if (ageH > 96) return 0;
  const hay = ` ${title} ${summary ?? ""} `.toLowerCase();
  let s = 0;
  s += Math.min(2, contains(hay, IMPORTANCE_FAITH)) * 8;
  s += Math.min(1, contains(hay, IMPORTANCE_EVENT)) * 6;
  s += Math.min(1, contains(hay, IMPORTANCE_SERVICE)) * 6;
  return Math.min(30, s);
}

export function finalScore(article: Article, ctx: ScoreCtx): number {
  const ageH = ageHours(article.publishedAt, ctx.now);
  const p = priorityScore(article.priority);
  const r = recencyScore(article.publishedAt, ctx.now);
  const i = importanceScore(article.title, article.summary, ageH);
  const home = ctx.isHomeCategory ? 6 : 0;
  const dampen = CATHOLIC_SOURCE_DAMPEN.has(article.source) ? CATHOLIC_SOURCE_PENALTY : 0;
  return p + r + i + home - dampen;
}

export function ageDays(publishedAt: string | null, now: Date): number {
  return ageHours(publishedAt, now) / 24;
}

export function isFresh(publishedAt: string | null, now: Date, withinHours = 6): boolean {
  return ageHours(publishedAt, now) <= withinHours;
}

export function isStale(publishedAt: string | null, now: Date, afterHours = 72): boolean {
  if (!publishedAt) return false;
  return ageHours(publishedAt, now) > afterHours;
}
