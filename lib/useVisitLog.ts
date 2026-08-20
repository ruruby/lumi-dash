"use client";

import { useCallback, useEffect, useState } from "react";

export type VisitRecord = {
  lastVisitedAt: number;
  /** Note count at the moment of that visit, so later growth is a real delta. */
  noteCountAtVisit: number;
};

const STORAGE_KEY = "lumi.visits";

export function useVisitLog() {
  const [visits, setVisits] = useState<Record<string, VisitRecord>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setVisits(JSON.parse(raw));
      } catch {
        // ignore malformed storage
      }
    }
    setHydrated(true);
  }, []);

  const recordVisit = useCallback(
    (folder: string, noteCount: number) => {
      if (!hydrated) return;
      setVisits((prev) => {
        const next = { ...prev, [folder]: { lastVisitedAt: Date.now(), noteCountAtVisit: noteCount } };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [hydrated],
  );

  return { visits, recordVisit };
}
