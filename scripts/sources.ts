// Source feed list for The Jesus Report.
//
// Every URL below was live-probed on 2026-08-18 (HTTP 200, parseable
// RSS/Atom, newest item within 60 days). Re-check any time with:
//   npm run validate:feeds
//
// Probed and SKIPPED (do not re-litigate without a new live probe):
//   HTTP 403: Desiring God first-party (/feed, /articles.rss, APJ), Banner of
//     Truth, Breakpoint, Church Times, Commonweal, ERLC, Core Christianity
//   HTTP 404: Bible Project (blog/site/podcast), Crossway /blog/feed and
//     /feed, Plough (all tried URLs), Wycliffe, Barnabas Aid, CSW, VOM,
//     Open Doors International/UK, National Catholic Register, OCA News,
//     USCCB, Premier Christianity, The Rabbit Room, UM News, Baptist Press
//     (empty), WORLD /feed (use magazine RSS instead)
//   NOT_FEED / HTML shell: Acton, CBN www1, Lausanne, Ligonier Learn,
//     Our Daily Bread, Themelios, Evangelical Focus
//   STALE (>60d): SIM, Mission Network News, Image Journal, Mere Fidelity,
//     Help Me Teach the Bible, Boundless, White Horse Inn, TGC author blogs
//   SKIPPED for quality: Pew Research Religion (newest 33d — will not
//     survive the public_life window), CBN rss.xml (3 undated items),
//     Positive News (two hopeful feeds is enough), ACNA / OCL (newest
//     outside the church 5-day hard window)
//   Open Doors US: HTTP 429 on probe — retry later, do not pad.

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

export type Priority = "critical" | "high" | "medium" | "low";

export interface FeedSource {
  name: string;
  url: string;
  category: CategoryId;
  priority: Priority;
}

export const SOURCES: FeedSource[] = [
  // ---------- scripture ----------
  { name: "Desiring God", url: "https://feeds.feedburner.com/DesiringGod", category: "scripture", priority: "high" },
  { name: "Ligonier", url: "https://www.ligonier.org/posts/rss.xml", category: "scripture", priority: "high" },
  { name: "Tabletalk", url: "https://tabletalkmagazine.com/feed/", category: "scripture", priority: "high" },

  // ---------- church ----------
  { name: "The Gospel Coalition", url: "https://www.thegospelcoalition.org/feed/", category: "church", priority: "critical" },
  { name: "Christianity Today", url: "https://www.christianitytoday.com/feed/", category: "church", priority: "critical" },
  // Catholic outlets stay on the homepage; medium/low so they do not
  // dominate lead / church / world ahead of evangelical and mainline feeds.
  { name: "Catholic News Agency", url: "https://www.ewtnnews.com/rss", category: "church", priority: "medium" },
  { name: "America Magazine", url: "https://www.americamagazine.org/feed", category: "church", priority: "medium" },
  { name: "The Pillar", url: "https://www.pillarcatholic.com/feed", category: "church", priority: "medium" },
  { name: "OSV News", url: "https://www.osvnews.com/feed/", category: "church", priority: "medium" },
  { name: "Christian Post", url: "https://www.christianpost.com/rss/", category: "church", priority: "high" },
  { name: "9Marks", url: "https://www.9marks.org/feed/", category: "church", priority: "high" },
  { name: "Crux", url: "https://wp.cruxnow.com/feed/", category: "church", priority: "medium" },
  { name: "Anglican Ink", url: "https://anglican.ink/feed/", category: "church", priority: "medium" },
  { name: "Episcopal News Service", url: "https://episcopalnewsservice.org/feed/", category: "church", priority: "medium" },
  { name: "Presbyterian Outlook", url: "https://pres-outlook.org/feed/", category: "church", priority: "medium" },
  { name: "LCMS Reporter", url: "https://reporter.lcms.org/feed/", category: "church", priority: "medium" },
  { name: "SBC Voices", url: "https://feeds2.feedburner.com/SbcVoices", category: "church", priority: "low" },
  { name: "ChurchLeaders", url: "https://churchleaders.com/feed", category: "church", priority: "low" },
  { name: "Christian Today UK", url: "https://www.christiantoday.com/rss.xml", category: "church", priority: "low" },

  // ---------- missions ----------
  { name: "IMB", url: "https://www.imb.org/feed/", category: "missions", priority: "high" },
  { name: "Samaritan's Purse", url: "https://www.samaritanspurse.org/feed/", category: "missions", priority: "medium" },
  { name: "World Vision", url: "https://www.worldvision.org/feed", category: "missions", priority: "medium" },

  // ---------- inspiration ----------
  { name: "Aleteia", url: "https://aleteia.org/feed/", category: "inspiration", priority: "low" },
  { name: "He Reads Truth", url: "https://hereadstruth.com/feed/", category: "inspiration", priority: "medium" },
  { name: "She Reads Truth", url: "https://shereadstruth.com/feed/", category: "inspiration", priority: "medium" },

  // ---------- culture ----------
  { name: "Comment Magazine", url: "https://comment.org/feed/", category: "culture", priority: "high" },
  { name: "Mockingbird", url: "https://mbird.com/feed/", category: "culture", priority: "medium" },
  { name: "Christ and Pop Culture", url: "https://christandpopculture.com/feed/", category: "culture", priority: "medium" },
  { name: "Englewood Review", url: "https://englewoodreview.org/feed/", category: "culture", priority: "medium" },

  // ---------- public_life ----------
  { name: "Religion News Service", url: "https://religionnews.com/feed/", category: "public_life", priority: "critical" },
  { name: "WORLD", url: "https://wng.org/feeds/rss/magazine.rss", category: "public_life", priority: "high" },
  { name: "Public Discourse", url: "https://www.thepublicdiscourse.com/feed/", category: "public_life", priority: "medium" },
  { name: "Canopy Forum", url: "https://canopyforum.org/feed/", category: "public_life", priority: "low" },

  // ---------- world ----------
  { name: "Vatican News", url: "https://www.vaticannews.va/en.rss.xml", category: "world", priority: "medium" },
  { name: "ICC Persecution", url: "https://persecution.org/feed/", category: "world", priority: "high" },
  { name: "Orthodox Times", url: "https://orthodoxtimes.com/feed/", category: "world", priority: "medium" },

  // ---------- theology ----------
  { name: "First Things", url: "https://firstthings.com/feed/", category: "theology", priority: "high" },
  { name: "Mere Orthodoxy", url: "https://mereorthodoxy.com/rss/", category: "theology", priority: "high" },
  { name: "Public Orthodoxy", url: "https://publicorthodoxy.org/feed/", category: "theology", priority: "medium" },
  { name: "Reformation 21", url: "https://reformation21.org/feed/", category: "theology", priority: "medium" },

  // ---------- family ----------
  { name: "Focus on the Family", url: "https://www.focusonthefamily.com/feed/", category: "family", priority: "medium" },

  // ---------- music_arts ----------
  { name: "CCM Magazine", url: "https://www.ccmmagazine.com/feed/", category: "music_arts", priority: "medium" },

  // ---------- positive ----------
  { name: "Good News Network", url: "https://www.goodnewsnetwork.org/feed/", category: "positive", priority: "low" },
  { name: "Reasons to be Cheerful", url: "https://reasonstobecheerful.world/feed/", category: "positive", priority: "low" },

  // ---------- podcasts ----------
  { name: "TGC Podcast", url: "https://www.thegospelcoalition.org/podcasts/tgc-podcast/feed/", category: "podcasts", priority: "high" },
  { name: "The Briefing", url: "https://albertmohler.com/feed/", category: "podcasts", priority: "medium" },
];

export interface AgeWindow {
  softDays: number;
  hardDays: number;
  minItems: number;
}

export const AGE_WINDOWS: Record<CategoryId, AgeWindow> = {
  inspiration:  { softDays: 3,  hardDays: 5,  minItems: 3 },
  positive:     { softDays: 3,  hardDays: 5,  minItems: 3 },
  public_life:  { softDays: 3,  hardDays: 5,  minItems: 3 },
  church:       { softDays: 3,  hardDays: 5,  minItems: 4 },
  missions:     { softDays: 7,  hardDays: 10, minItems: 3 },
  world:        { softDays: 7,  hardDays: 10, minItems: 3 },
  family:       { softDays: 7,  hardDays: 10, minItems: 3 },
  culture:      { softDays: 7,  hardDays: 10, minItems: 3 },
  music_arts:   { softDays: 7,  hardDays: 10, minItems: 3 },
  scripture:    { softDays: 14, hardDays: 21, minItems: 3 },
  theology:     { softDays: 14, hardDays: 21, minItems: 3 },
  podcasts:     { softDays: 14, hardDays: 21, minItems: 3 },
};

export const KEYWORDS: { match: string[]; routeTo: CategoryId }[] = [
  { match: ["bible study", "scripture", "exegesis", "commentary", "lectionary", "original language", "hebrew", "greek testament", "reading plan"], routeTo: "scripture" },
  { match: ["church plant", "pastor", "congregation", "denomination", "worship service", "ordination", "synod", "sbc ", "vatican", "diocese"], routeTo: "church" },
  { match: ["missionary", "missions", "unreached", "relief", "refugee", "prison ministry", "homeless", "adoption", "bible translation"], routeTo: "missions" },
  { match: ["devotional", "testimony", "encouragement", "hope in", "good news"], routeTo: "inspiration" },
  { match: ["film", "novel", "poetry", "literature", "education", "university", "art exhibit"], routeTo: "culture" },
  { match: ["religious liberty", "first amendment", "church and state", "supreme court", "religious freedom"], routeTo: "public_life" },
  { match: ["persecution", "martyr", "holy land", "jerusalem", "nigeria church", "north korea"], routeTo: "world" },
  { match: ["theology", "apologetics", "doctrine", "creed", "reformation", "encyclical"], routeTo: "theology" },
  { match: ["marriage", "parenting", "pro-life", "abortion", "caregiving", "family"], routeTo: "family" },
  { match: ["worship music", "hymn", "liturgy", "sacred music", "choir"], routeTo: "music_arts" },
];

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "scripture",    label: "SCRIPTURE & STUDY",      short: "SCRIPTURE" },
  { id: "church",       label: "CHURCH & MINISTRY",      short: "CHURCH" },
  { id: "missions",     label: "MISSIONS & SERVICE",     short: "MISSIONS" },
  { id: "inspiration",  label: "INSPIRATION",            short: "INSPIRE" },
  { id: "culture",      label: "FAITH & CULTURE",        short: "CULTURE" },
  { id: "public_life",  label: "PUBLIC LIFE",            short: "PUBLIC" },
  { id: "world",        label: "WORLD & PERSECUTION",    short: "WORLD" },
  { id: "theology",     label: "THEOLOGY & APOLOGETICS", short: "THEOLOGY" },
  { id: "family",       label: "FAMILY & LIFE",          short: "FAMILY" },
  { id: "music_arts",   label: "WORSHIP & ARTS",         short: "ARTS" },
  { id: "positive",     label: "HOPEFUL NEWS",           short: "HOPE" },
  { id: "podcasts",     label: "TALKS & PODCASTS",       short: "TALKS" },
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 50,
  medium: 10,
  low: 1,
};
