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
//   Open Doors US: HTTP 429 on probe — Open Doors Australia is the live feed.
//
// Removed on purpose (do not re-add):
//   Catholic-institution wires: Vatican News, Catholic News Agency, America
//     Magazine, The Pillar, OSV News, Crux, Aleteia. Pope / Vatican /
//     Catholic-church headlines from every other wire are dropped in
//     scripts/lib/editorial.ts.
//   Secular hopeful fillers: Good News Network, Reasons to be Cheerful.
//   Empty RSS shells (HTTP 200, zero items): Baptist Press, NAMB, Send Relief, ERLC.

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
  { name: "Truth For Life", url: "https://feeds.feedburner.com/TruthForLife", category: "scripture", priority: "high" },
  { name: "Back to the Bible", url: "https://www.backtothebible.org/blog-feed.xml", category: "scripture", priority: "high" },
  { name: "Crossway", url: "https://www.crossway.org/articles/rss/", category: "scripture", priority: "medium" },
  { name: "Gentle Reformation", url: "https://gentlereformation.com/feed/", category: "scripture", priority: "high" },
  { name: "TGC Read the Bible", url: "https://www.thegospelcoalition.org/devotionals/read-the-bible/feed/?feed=podcast_rtb", category: "scripture", priority: "high" },
  { name: "The Bible Recap", url: "https://feed.podbean.com/thebiblerecap/feed.xml", category: "scripture", priority: "high" },
  { name: "Daily Audio Bible", url: "http://feeds.feedburner.com/dailyaudiobible", category: "scripture", priority: "medium" },
  { name: "Enduring Word", url: "https://enduringword.com/podcasts/feed/", category: "scripture", priority: "high" },
  { name: "Grace to You Readings", url: "https://feeds.gty.org/gtydailyreadingsone&x=1", category: "scripture", priority: "high" },
  { name: "Bible in One Year", url: "https://content.bioy.app/rss/podcast?limit=365&locale=en&variant=classic", category: "scripture", priority: "high" },
  { name: "843 Acres", url: "https://theparkforum.org/category/843-acres/feed/", category: "scripture", priority: "high" },
  { name: "Bible Pathway", url: "https://www.crosswalk.com/devotionals/biblepathways/rss.xml", category: "scripture", priority: "medium" },
  { name: "Quiet Walk", url: "https://www.crosswalk.com/devotionals/quiet-walk/rss.xml", category: "scripture", priority: "medium" },
  { name: "Fighter Verses", url: "https://www.fighterverses.com/blog-feed.xml", category: "scripture", priority: "medium" },

  // ---------- church ----------
  { name: "The Gospel Coalition", url: "https://www.thegospelcoalition.org/feed/", category: "church", priority: "critical" },
  { name: "Christianity Today", url: "https://www.christianitytoday.com/feed/", category: "church", priority: "critical" },
  { name: "Christian Post", url: "https://www.christianpost.com/rss/", category: "church", priority: "high" },
  { name: "Baptist Standard", url: "https://baptiststandard.com/feed/", category: "church", priority: "high" },
  { name: "AG News", url: "https://news.ag.org/rss", category: "church", priority: "medium" },
  { name: "Evangelical Times", url: "https://www.evangelical-times.org/rss/", category: "church", priority: "medium" },
  { name: "9Marks", url: "https://www.9marks.org/feed/", category: "church", priority: "high" },
  { name: "Anglican Ink", url: "https://anglican.ink/feed/", category: "church", priority: "medium" },
  { name: "Episcopal News Service", url: "https://episcopalnewsservice.org/feed/", category: "church", priority: "medium" },
  { name: "Presbyterian Outlook", url: "https://pres-outlook.org/feed/", category: "church", priority: "medium" },
  { name: "LCMS Reporter", url: "https://reporter.lcms.org/feed/", category: "church", priority: "medium" },
  { name: "SBC Voices", url: "https://feeds2.feedburner.com/SbcVoices", category: "church", priority: "low" },
  { name: "ChurchLeaders", url: "https://churchleaders.com/feed", category: "church", priority: "low" },
  { name: "Christian Today UK", url: "https://www.christiantoday.com/rss.xml", category: "church", priority: "low" },

  // ---------- missions ----------
  { name: "IMB", url: "https://www.imb.org/feed/", category: "missions", priority: "high" },
  { name: "Wycliffe", url: "https://wycliffe.net/feed/", category: "missions", priority: "medium" },
  { name: "Samaritan's Purse", url: "https://www.samaritanspurse.org/feed/", category: "missions", priority: "medium" },
  { name: "World Vision", url: "https://www.worldvision.org/feed", category: "missions", priority: "medium" },

  // ---------- inspiration ----------
  { name: "Our Daily Bread", url: "https://odb.org/feed/", category: "inspiration", priority: "critical" },
  { name: "Harvest Ministries", url: "https://harvest.org/resources/devotion/feed/", category: "inspiration", priority: "high" },
  { name: "Scotty Smith", url: "https://www.thegospelcoalition.org/blogs/scotty-smith/feed/", category: "inspiration", priority: "high" },
  { name: "Joni and Friends", url: "https://www.joniandfriends.org/feed/", category: "inspiration", priority: "high" },
  { name: "Insight for Living", url: "https://insight.org/feed/RSSDevoApp", category: "inspiration", priority: "high" },
  { name: "Solid Joys", url: "https://feed.desiringgod.org/solid-joys-audio.rss", category: "inspiration", priority: "high" },
  { name: "Drawing Near", url: "https://feeds.gty.org/gtydrawingnear&x=1", category: "inspiration", priority: "high" },
  { name: "Truth For Life Devotional", url: "https://feeds.feedburner.com/truthforlife/alistairbeggdevotionalpodcast", category: "inspiration", priority: "high" },
  { name: "Things Unseen", url: "https://rss.libsyn.com/shows/449418/destinations/3771729.xml", category: "inspiration", priority: "high" },
  { name: "Today in the Word", url: "https://www.omnycontent.com/d/playlist/a8cdbf10-d816-4c77-9e79-aa1c012547e1/e16b938e-d652-4fa8-b1d9-ace601786fac/c6f332f4-1e26-475d-b662-ace601786fbe/podcast.rss", category: "inspiration", priority: "high" },
  { name: "In Touch", url: "https://www.omnycontent.com/d/playlist/7237c071-cd56-4495-998a-b23d00f69e8d/87d53d0c-9dc6-4151-b94e-b26701575b7f/20bba2fb-121b-493a-b694-b26701575b98/podcast.rss", category: "inspiration", priority: "high" },
  { name: "Pray the Word", url: "https://rss.buzzsprout.com/112848.rss", category: "inspiration", priority: "medium" },
  { name: "Heartlight", url: "https://feeds.feedburner.com/hl-devos-votd", category: "inspiration", priority: "high" },
  { name: "First15", url: "https://www.first15.org/devotionals/feed.rss", category: "inspiration", priority: "high" },
  { name: "Today", url: "https://todaydevotional.com/feed/", category: "inspiration", priority: "high" },
  { name: "Open the Bible", url: "https://openthebible.org/open-the-bible-daily/feed/", category: "inspiration", priority: "high" },
  { name: "Encouragement for Today", url: "https://www.crosswalk.com/devotionals/encouragement/rss.xml", category: "inspiration", priority: "high" },
  { name: "Morning and Evening", url: "https://www.crosswalk.com/devotionals/morningandevening/rss.xml", category: "inspiration", priority: "medium" },
  { name: "Your Daily Prayer", url: "https://www.crosswalk.com/devotionals/your-daily-prayer/rss.xml", category: "inspiration", priority: "medium" },
  { name: "Time of Grace", url: "https://timeofgrace.org/feed/", category: "inspiration", priority: "medium" },
  { name: "Revive Our Hearts", url: "https://cdn.reviveourhearts.com/podcasts/itunes/revive-our-hearts.rss", category: "inspiration", priority: "medium" },
  { name: "He Reads Truth", url: "https://hereadstruth.com/feed/", category: "inspiration", priority: "high" },
  { name: "She Reads Truth", url: "https://shereadstruth.com/feed/", category: "inspiration", priority: "high" },
  { name: "Ann Voskamp", url: "https://annvoskamp.com/feed/", category: "inspiration", priority: "medium" },
  { name: "Challies", url: "https://www.challies.com/feed/", category: "inspiration", priority: "medium" },

  // ---------- culture ----------
  { name: "Comment Magazine", url: "https://comment.org/feed/", category: "culture", priority: "high" },
  { name: "Mockingbird", url: "https://mbird.com/feed/", category: "culture", priority: "medium" },
  { name: "Christ and Pop Culture", url: "https://christandpopculture.com/feed/", category: "culture", priority: "medium" },
  { name: "Englewood Review", url: "https://englewoodreview.org/feed/", category: "culture", priority: "medium" },

  // ---------- public_life ----------
  { name: "Religion News Service", url: "https://religionnews.com/feed/", category: "public_life", priority: "critical" },
  { name: "Christian Concern", url: "https://christianconcern.com/feed/", category: "public_life", priority: "medium" },
  { name: "WORLD", url: "https://wng.org/feeds/rss/magazine.rss", category: "public_life", priority: "high" },
  { name: "Public Discourse", url: "https://www.thepublicdiscourse.com/feed/", category: "public_life", priority: "medium" },
  { name: "Canopy Forum", url: "https://canopyforum.org/feed/", category: "public_life", priority: "low" },

  // ---------- world ----------
  { name: "ICC Persecution", url: "https://persecution.org/feed/", category: "world", priority: "medium" },
  { name: "Open Doors", url: "https://www.opendoors.org.au/feed/", category: "world", priority: "medium" },
  { name: "Orthodox Times", url: "https://orthodoxtimes.com/feed/", category: "world", priority: "medium" },

  // ---------- theology ----------
  { name: "First Things", url: "https://firstthings.com/feed/", category: "theology", priority: "high" },
  { name: "Mere Orthodoxy", url: "https://mereorthodoxy.com/rss/", category: "theology", priority: "high" },
  { name: "Public Orthodoxy", url: "https://publicorthodoxy.org/feed/", category: "theology", priority: "medium" },
  { name: "Reformation 21", url: "https://reformation21.org/feed/", category: "theology", priority: "medium" },
  { name: "Place for Truth", url: "https://www.placefortruth.org/feed", category: "theology", priority: "medium" },
  { name: "Westminster Shorter Catechism", url: "https://rss.libsyn.com/shows/260072/destinations/1973036.xml", category: "theology", priority: "medium" },

  // ---------- family ----------
  { name: "Focus on the Family", url: "https://www.focusonthefamily.com/feed/", category: "family", priority: "medium" },
  { name: "Club 31 Women", url: "https://club31women.com/feed/", category: "family", priority: "medium" },

  // ---------- music_arts ----------
  { name: "CCM Magazine", url: "https://www.ccmmagazine.com/feed/", category: "music_arts", priority: "medium" },

  // ---------- podcasts ----------
  { name: "TGC Podcast", url: "https://www.thegospelcoalition.org/podcasts/tgc-podcast/feed/", category: "podcasts", priority: "high" },
  { name: "Ask Pastor John", url: "https://feeds.feedburner.com/AskPastorJohn", category: "podcasts", priority: "high" },
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
  { match: ["bible study", "exegesis", "commentary", "lectionary", "reading plan", "greek testament"], routeTo: "scripture" },
  { match: ["church plant", "ordination", "sbc "], routeTo: "church" },
  { match: ["missionary", "missionaries", "unreached", "bible translation"], routeTo: "missions" },
  { match: ["devotional", "testimony"], routeTo: "inspiration" },
  { match: ["religious liberty", "religious freedom", "first amendment"], routeTo: "public_life" },
  { match: ["persecution", "persecuted", "martyr", "massacre"], routeTo: "world" },
  { match: ["apologetics", "doctrine"], routeTo: "theology" },
  { match: ["parenting", "pro-life", "abortion"], routeTo: "family" },
  { match: ["worship music", "hymn", "liturgy", "sacred music", "choir"], routeTo: "music_arts" },
];

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "scripture",    label: "BIBLE READING & STUDY",  short: "SCRIPTURE" },
  { id: "inspiration",  label: "DEVOTION & ENCOURAGEMENT", short: "DEVOTION" },
  { id: "church",       label: "FAITH & COMMUNITY",      short: "COMMUNITY" },
  { id: "family",       label: "FAMILY & LIFE",          short: "FAMILY" },
  { id: "theology",     label: "THEOLOGY & APOLOGETICS", short: "THEOLOGY" },
  { id: "podcasts",     label: "TALKS & PODCASTS",       short: "TALKS" },
  { id: "missions",     label: "MISSIONS & SERVICE",     short: "MISSIONS" },
  { id: "culture",      label: "FAITH & CULTURE",        short: "CULTURE" },
  { id: "music_arts",   label: "WORSHIP & ARTS",         short: "ARTS" },
  { id: "public_life",  label: "PUBLIC LIFE",            short: "PUBLIC" },
  { id: "world",        label: "WORLD & PERSECUTION",    short: "WORLD" },
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 50,
  medium: 10,
  low: 1,
};
