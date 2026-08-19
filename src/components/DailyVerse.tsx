import type { DailyVerse as DailyVerseData } from "../lib/types";

export function DailyVerse({ verse }: { verse: DailyVerseData | null }) {
  if (!verse) return null;

  const cite = [verse.reference, verse.version].filter(Boolean).join(" · ");

  return (
    <section>
      <h2 className="section-heading">{verse.source}</h2>
      <a
        href={verse.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline hover:underline"
      >
        {verse.title && (
          <span className="block text-[11px] uppercase tracking-wider opacity-60 mb-1">
            {verse.title}
          </span>
        )}
        <span className="block text-[14px] italic leading-snug">“{verse.text}”</span>
        <span className="block text-[12px] opacity-60 mt-1">{cite}</span>
      </a>
    </section>
  );
}
