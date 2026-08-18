// Western liturgical calendar, computed at build time for a one-line
// masthead. No third-party APIs. Easter uses the Anonymous Gregorian algorithm.

export interface ChurchYear {
  season: string;
  line: string;
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function dayUtc(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

export function adventSunday(year: number): Date {
  const christmas = utcDate(year, 12, 25);
  const dow = christmas.getUTCDay();
  const fourthSunday = new Date(christmas);
  fourthSunday.setUTCDate(25 - dow);
  const advent1 = new Date(fourthSunday);
  advent1.setUTCDate(fourthSunday.getUTCDate() - 21);
  return advent1;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function churchYearLine(now: Date = new Date()): ChurchYear {
  const year = now.getUTCFullYear();
  const today = dayUtc(now);
  const easter = easterSunday(year);
  const easterMs = dayUtc(easter);
  const ash = new Date(easter);
  ash.setUTCDate(easter.getUTCDate() - 46);
  const pentecost = new Date(easter);
  pentecost.setUTCDate(easter.getUTCDate() + 49);
  const advent = adventSunday(year);
  const nextAdvent = adventSunday(year + 1);
  const christmas = utcDate(year, 12, 25);
  const epiphany = utcDate(year, 1, 6);
  const lastChristmas = utcDate(year - 1, 12, 25);

  let season = "Ordinary Time";
  if (today >= dayUtc(advent) && today < dayUtc(christmas)) {
    season = "Advent";
  } else if (
    (today >= dayUtc(christmas) && today <= dayUtc(utcDate(year, 12, 31))) ||
    (today >= dayUtc(lastChristmas) && today < dayUtc(epiphany))
  ) {
    season = "Christmas";
  } else if (today >= dayUtc(epiphany) && today < dayUtc(ash)) {
    season = "Epiphany";
  } else if (today >= dayUtc(ash) && today < easterMs) {
    season = today >= easterMs - 7 * 86_400_000 ? "Holy Week" : "Lent";
  } else if (today >= easterMs && today <= dayUtc(pentecost)) {
    season = today === easterMs ? "Easter" : "Eastertide";
  } else if (today > dayUtc(pentecost) && today < dayUtc(advent)) {
    season = "Ordinary Time";
  } else if (today >= dayUtc(nextAdvent)) {
    season = "Advent";
  }

  const weekday = WEEKDAYS[now.getUTCDay()];
  const date = `${MONTHS[now.getUTCMonth()]} ${now.getUTCDate()}`;
  return {
    season,
    line: `${season} · ${weekday}, ${date}`,
  };
}
