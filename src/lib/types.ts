export type Priority = "critical" | "high" | "medium" | "low";

export type CategoryId =
  | "scripture"
  | "church"
  | "missions"
  | "inspiration"
  | "culture"
  | "public_life"
  | "world"
  | "theology"
  | "family"
  | "music_arts"
  | "positive"
  | "podcasts";

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

export interface FeedStat {
  source: string;
  ok: boolean;
  count: number;
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
  feedStats: FeedStat[];
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

export type VerseSourceId = "our-daily-bread" | "bible-gateway" | "youversion";

export interface DailyVerse {
  id: VerseSourceId;
  source: string;
  text: string;
  reference: string;
  url: string;
  version?: string | null;
  title?: string | null;
  fetchedAt: string;
}

export interface VersesPayload {
  generatedAt: string;
  verses: DailyVerse[];
}
