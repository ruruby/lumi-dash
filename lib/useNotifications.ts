"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSampleCandidates, getSampleSignalFeed } from "@/lib/sample-mode";
import type { Candidate } from "@/lib/research-types";
import type { SignalFeed } from "@/lib/signal-types";

const STORAGE_KEY = "lumi.notifications.lastSeenAt";
const MAX_ITEMS = 10;

export type NotificationItem =
  | { kind: "signal"; id: string; title: string; at: number }
  | { kind: "inboxCandidate"; id: string; title: string; at: number; topicKey: string };

/**
 * The bell's two sources: fresh News & Signals items and unreviewed Research
 * Collector candidates. Both are already computed elsewhere in the app — this
 * hook only merges them and tracks when the user last looked, the same
 * single-timestamp pattern as `useVisitLog`.
 */
export function useNotifications(signalFeed: SignalFeed | null, demo: boolean) {
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [liveCandidates, setLiveCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Number.isFinite(parsed)) setLastSeenAt(parsed);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (demo) return;

    let cancelled = false;
    fetch("/api/research")
      .then(async (response) => {
        const data = await response.json();
        if (cancelled || !response.ok) return;
        setLiveCandidates((data.candidates ?? []) as Candidate[]);
      })
      .catch(() => {
        // A missing notification list is better than a broken bell.
      });

    return () => {
      cancelled = true;
    };
  }, [demo]);

  const candidates = useMemo(
    () => (demo ? [...getSampleCandidates("LLM 핵심 기술"), ...getSampleCandidates("LLM 개발 도구")] : liveCandidates),
    [demo, liveCandidates],
  );
  const feed = demo ? getSampleSignalFeed() : signalFeed;

  const items = useMemo<NotificationItem[]>(() => {
    const signalItems: NotificationItem[] = (feed?.items ?? []).map((item) => ({
      kind: "signal",
      id: `signal:${item.id}`,
      title: item.title,
      at: item.at,
    }));

    const candidateItems: NotificationItem[] = candidates
      .filter((candidate) => candidate.status === "new")
      .map((candidate) => ({
        kind: "inboxCandidate",
        id: `candidate:${candidate.id}`,
        title: candidate.title,
        at: candidate.collectedAt,
        topicKey: candidate.topicKey,
      }));

    return [...signalItems, ...candidateItems].sort((a, b) => b.at - a.at).slice(0, MAX_ITEMS);
  }, [feed, candidates]);

  const unreadCount = useMemo(() => {
    if (lastSeenAt === null) return items.length;
    return items.filter((item) => item.at > lastSeenAt).length;
  }, [items, lastSeenAt]);

  /** Opening the dropdown counts as having seen everything currently listed. */
  const markSeen = useCallback(() => {
    if (!hydrated) return;
    const now = Date.now();
    setLastSeenAt(now);
    window.localStorage.setItem(STORAGE_KEY, String(now));
  }, [hydrated]);

  return { items, unreadCount, lastSeenAt, markSeen };
}
