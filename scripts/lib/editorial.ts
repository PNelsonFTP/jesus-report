// Editorial filters applied at build time, before ranking.

const POPE_OR_VATICAN =
  /\b(pope|papal|pontiff|vatican|holy see|leo xiv|pope leo|pope francis)\b/i;

const CATHOLIC_INSTITUTION =
  /\b(catholics?|roman catholic|catholic church|canoniz\w*|beatificat\w*|encyclical|magisterium|dicastery|archdiocese|dioceses?|cardinals?|monsignor|u\.?s\.? bishops|catholic bishops|bishops' conference|conference of bishops)\b/i;

// A Catholic mention can stay when the story is persecution, disaster, or a
// public ruling — not news from inside the Catholic church.
const GENERAL_NEWS =
  /\b(persecut\w*|martyrs?|massacre|genocide|kidnapp?\w*|abduct\w*|imprison\w*|hostage|killed|killing|killings|disaster|earthquake|floods?|famine|bomb\w*|attacked|attacks)\b/i;

const PUBLIC_RULING =
  /\b(supreme court|appeals court|court ruling|religious liberty|religious freedom|first amendment)\b/i;

const PERSECUTION =
  /\b(persecut\w*|martyrs?|massacre|genocide|kidnapp?\w*|abduct\w*|imprison\w*|hostage|killed|killing|killings|detained|church attack|attacks on churches|bomb\w*)\b/i;

export const PERSECUTION_SOURCES = new Set([
  "ICC Persecution",
  "Open Doors",
]);

export function isCatholicChurchNews(title: string, summary: string | null): boolean {
  const hay = `${title} ${summary ?? ""}`;
  if (POPE_OR_VATICAN.test(hay)) return true;
  if (!CATHOLIC_INSTITUTION.test(hay)) return false;
  if (GENERAL_NEWS.test(hay) || PUBLIC_RULING.test(hay)) return false;
  return true;
}

export function isPersecutionStory(title: string, summary: string | null): boolean {
  return PERSECUTION.test(`${title} ${summary ?? ""}`);
}
