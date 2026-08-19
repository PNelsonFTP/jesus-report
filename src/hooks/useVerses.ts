import { useEffect, useState } from "react";
import type { DailyVerse, VerseSourceId, VersesPayload } from "../lib/types";

const VERSES_URL = `${import.meta.env.BASE_URL}data/verses.json`;
const VERSES_CACHE_KEY = "jesus-report:cache:verses";

function readCache(): VersesPayload | null {
  try {
    const raw = sessionStorage.getItem(VERSES_CACHE_KEY);
    return raw ? (JSON.parse(raw) as VersesPayload) : null;
  } catch {
    return null;
  }
}

export function verseById(payload: VersesPayload | null, id: VerseSourceId): DailyVerse | null {
  return payload?.verses.find((v) => v.id === id) ?? null;
}

export function useVerses() {
  const [verses, setVerses] = useState<VersesPayload | null>(() => readCache());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(VERSES_URL, { cache: "no-cache" });
        if (!res.ok) return;
        const data = (await res.json()) as VersesPayload;
        if (cancelled || !Array.isArray(data.verses)) return;
        setVerses(data);
        try {
          sessionStorage.setItem(VERSES_CACHE_KEY, JSON.stringify(data));
        } catch {
          /* quota */
        }
      } catch {
        /* keep cache */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return verses;
}
