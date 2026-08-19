import type { DailyVerse as DailyVerseData } from "../lib/types";

interface DailyVerseProps {
  verse: DailyVerseData | null;
  variant: "masthead" | "pullquote" | "footer";
}

function citedLine(verse: DailyVerseData): string {
  const bits = [verse.reference];
  if (verse.version) bits.push(verse.version);
  bits.push(verse.source);
  return bits.join(" · ");
}

export function DailyVerse({ verse, variant }: DailyVerseProps) {
  if (!verse) return null;

  if (variant === "masthead") {
    return (
      <a
        href={verse.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 max-w-xl no-underline hover:underline"
      >
        <span className="block text-[10px] uppercase tracking-widest text-[var(--gold)] font-sans">
          {verse.source}
          {verse.title ? ` · ${verse.title}` : ""}
        </span>
        <span className="block text-[14px] italic leading-snug mt-0.5">
          “{verse.text}”
        </span>
        <span className="text-[12px] opacity-60">{verse.reference}</span>
      </a>
    );
  }

  if (variant === "pullquote") {
    return (
      <section className="my-10 text-center max-w-2xl mx-auto px-2">
        <h2 className="text-[11px] uppercase tracking-[0.14em] text-[var(--crimson)] font-sans font-bold mb-3">
          Verse of the Day
        </h2>
        <blockquote className="text-[20px] italic leading-snug">
          “{verse.text}”
        </blockquote>
        <p className="mt-3 text-[12px] opacity-70">
          <a href={verse.url} target="_blank" rel="noopener noreferrer" className="underline">
            {citedLine(verse)}
          </a>
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 mb-2 border-t border-current border-opacity-20 pt-5">
      <a
        href={verse.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-xl no-underline hover:underline"
      >
        <span className="block text-[10px] uppercase tracking-widest opacity-50 font-sans mb-1">
          {verse.source} · Verse of the Day
        </span>
        <span className="block text-[13px] italic leading-snug">“{verse.text}”</span>
        <span className="text-[12px] opacity-60">{verse.reference}</span>
      </a>
    </section>
  );
}
