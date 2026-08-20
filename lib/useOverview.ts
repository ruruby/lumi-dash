"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OverviewMetrics, OverviewNarrative } from "@/lib/overview-types";

export type OverviewCategory = { name: string; folder: string; keywords: string[] };

export type OverviewState = {
  metrics: OverviewMetrics | null;
  narrative: OverviewNarrative | null;
  narrativeError: string | null;
  loadingMetrics: boolean;
  loadingNarrative: boolean;
  error: string | null;
};

const INITIAL: OverviewState = {
  metrics: null,
  narrative: null,
  narrativeError: null,
  loadingMetrics: false,
  loadingNarrative: false,
  error: null,
};

export function useOverview(vaultPath: string, categories: OverviewCategory[], windowDays: number) {
  const [state, setState] = useState<OverviewState>(INITIAL);

  // Categories arrive as a fresh array each render; key on content so the metrics
  // effect only re-runs when the actual inputs change.
  const signature = JSON.stringify(categories.map((c) => [c.name, c.folder, c.keywords]));
  const signatureRef = useRef(signature);
  signatureRef.current = signature;

  const request = useCallback(
    async (withNarrative: boolean) => {
      if (!vaultPath || categories.length === 0) {
        setState(INITIAL);
        return;
      }

      setState((prev) => ({
        ...prev,
        loadingMetrics: !withNarrative || prev.metrics === null,
        loadingNarrative: withNarrative,
        error: null,
        narrativeError: null,
      }));

      try {
        const response = await fetch("/api/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vaultPath, categories, windowDays, withNarrative }),
        });
        const data = await response.json();

        if (!response.ok) {
          setState({ ...INITIAL, error: data.error ?? "불러오지 못했어요." });
          return;
        }

        setState((prev) => ({
          metrics: data.metrics ?? prev.metrics,
          narrative: withNarrative ? (data.narrative ?? null) : prev.narrative,
          narrativeError: data.narrativeError ?? null,
          loadingMetrics: false,
          loadingNarrative: false,
          error: null,
        }));
      } catch {
        setState({ ...INITIAL, error: "네트워크 오류로 불러오지 못했어요." });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vaultPath, signature, windowDays],
  );

  // Numbers are cheap and honest, so they load on their own; the AI pass is opt-in.
  useEffect(() => {
    request(false);
  }, [request]);

  const runNarrative = useCallback(() => request(true), [request]);

  return { ...state, runNarrative };
}
