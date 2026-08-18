// Shared types between build scripts and the client SPA.

import type { CategoryId, Priority } from "./sources";

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  category: CategoryId;
  priority: Priority;
  publishedAt: string | null;
  publishedRaw: string | null;
  summary: string | null;
  collectedAt: string;
}

export interface GroupedArticle extends Article {
  related: Article[];
}

export interface TrendingStory {
  lead: GroupedArticle;
  sources: string[];
  sourceCount: number;
  categoryIds: string[];
}

export interface CategoryBucket {
  id: CategoryId;
  label: string;
  articles: GroupedArticle[];
  articlesAll: GroupedArticle[];
  sourceCount: number;
  fullCount?: number;
}

export interface ChurchYear {
  season: string;
  line: string;
}

export interface HeadlinesPayload {
  generatedAt: string;
  totalCount: number;
  trending: TrendingStory[];
  categories: CategoryBucket[];
  feedStats: { source: string; ok: boolean; count: number }[];
  leadUrl?: string | null;
  churchYear?: ChurchYear;
  partial?: boolean;
}

export interface Brief {
  generatedAt: string;
  source: "claude" | "fallback";
  headline: string;
  bullets: string[];
  citedArticles: { title: string; url: string; source: string }[];
}
