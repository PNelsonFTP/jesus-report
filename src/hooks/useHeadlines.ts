import { useCallback, useEffect, useRef, useState } from "react";
import type { Brief, HeadlinesPayload } from "../lib/types";

const PREVIEW_URL   = `${import.meta.env.BASE_URL}data/headlines-preview.json`;
const HEADLINES_URL = `${import.meta.env.BASE_URL}data/headlines.json`;
const BRIEF_URL     = `${import.meta.env.BASE_URL}data/brief.json`;

const HEADLINES_CACHE_KEY = "jesus-report:cache:headlines";
const BRIEF_CACHE_KEY     = "jesus-report:cache:brief";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function isFullPayload(h: HeadlinesPayload | null): h is HeadlinesPayload {
  return !!h && !h.partial;
}

export function useHeadlines() {
  const cached = readCache<HeadlinesPayload>(HEADLINES_CACHE_KEY);
  const [headlines, setHeadlines] = useState<HeadlinesPayload | null>(() => cached);
  const [brief, setBrief] = useState<Brief | null>(() =>
    readCache<Brief>(BRIEF_CACHE_KEY)
  );
  const [error, setError] = useState<string | null>(null);

  const fullPromise = useRef<Promise<HeadlinesPayload | null> | null>(null);

  const applyFull = useCallback((h: HeadlinesPayload) => {
    setHeadlines(h);
    writeCache(HEADLINES_CACHE_KEY, h);
  }, []);

  const loadFull = useCallback(() => {
    if (!fullPromise.current) {
      fullPromise.current = fetchJson<HeadlinesPayload>(HEADLINES_URL);
    }
    return fullPromise.current.then((h) => {
      if (h && isFullPayload(h)) applyFull(h);
      return h;
    });
  }, [applyFull]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const haveFullCache = isFullPayload(cached);
      const [preview, b] = await Promise.all([
        haveFullCache ? Promise.resolve(null) : fetchJson<HeadlinesPayload>(PREVIEW_URL),
        fetchJson<Brief>(BRIEF_URL),
      ]);
      if (cancelled) return;

      if (preview && !isFullPayload(headlines)) {
        setHeadlines(preview);
        if (!haveFullCache) writeCache(HEADLINES_CACHE_KEY, preview);
      }

      if (b) {
        setBrief(b);
        writeCache(BRIEF_CACHE_KEY, b);
      }

      const full = await loadFull();
      if (cancelled) return;
      if (!full && !preview && !haveFullCache) {
        setError("Failed to load headlines.");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { headlines, brief, error, loadFull };
}
