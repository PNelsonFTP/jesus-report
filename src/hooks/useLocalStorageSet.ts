import { useCallback, useEffect, useState } from "react";
import type { Article } from "../lib/types";

function makeReader(key: string) {
  return function read(): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
      return new Set();
    }
  };
}

function makeWriter(key: string) {
  return function write(ids: Set<string>) {
    try {
      localStorage.setItem(key, JSON.stringify([...ids]));
    } catch {
      /* best-effort */
    }
  };
}

function useLocalStorageSet(key: string) {
  const read = makeReader(key);
  const write = makeWriter(key);
  const [set, setSet] = useState<Set<string>>(() => read());

  useEffect(() => {
    const handler = () => setSet(read());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  const toggle = useCallback((id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      write(next);
      return next;
    });
  }, []);

  const add = useCallback((id: string) => {
    setSet((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSet((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      write(next);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => set.has(id), [set]);

  return { set, toggle, add, remove, has };
}

export function useBookmarks() {
  const { set: bookmarks, toggle, has } = useLocalStorageSet("jesus-report:bookmarks");
  return { bookmarks, toggle, has };
}

export function useReadLater() {
  const { set: queue, toggle, has, remove } = useLocalStorageSet("jesus-report:read-later");
  return { queue, toggle, has, remove };
}

export function useMutedSources() {
  const { set: muted, toggle, has } = useLocalStorageSet("jesus-report:muted-sources");
  return { muted, toggle, has };
}

export function useMutedCategories() {
  const { set: muted, toggle, has } = useLocalStorageSet("jesus-report:muted-categories");
  return { muted, toggle, has };
}

const SNAPSHOT_KEY = "jesus-report:article-snapshots";

function readSnapshots(): Record<string, Article> {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export function useArticleSnapshots() {
  const [snapshots, setSnapshots] = useState<Record<string, Article>>(() => readSnapshots());

  const sync = useCallback((keep: Set<string>, available: Map<string, Article>) => {
    setSnapshots((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of keep) {
        const live = available.get(id);
        if (live && !next[id]) {
          next[id] = live;
          changed = true;
        }
      }
      for (const id of Object.keys(next)) {
        if (!keep.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      if (!changed) return prev;
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      return next;
    });
  }, []);

  return { snapshots, sync };
}
