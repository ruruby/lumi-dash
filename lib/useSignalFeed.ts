"use client";

import { useEffect, useState } from "react";
import { getSampleSignalFeed } from "@/lib/sample-mode";
import type { SignalFeed } from "@/lib/signal-types";

export type SignalFeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; feed: SignalFeed; demo?: boolean };

export function useSignalFeed(keywords: string[], demo = false): SignalFeedState {
  const [state, setState] = useState<SignalFeedState>({ status: "loading" });

  useEffect(() => {
    if (demo) {
      setState({ status: "ready", feed: getSampleSignalFeed(), demo: true });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    const keywordsParam = encodeURIComponent(keywords.join(","));
    fetch(`/api/signals?keywords=${keywordsParam}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({ status: "error", message: data.error ?? "신호를 불러오지 못했어요." });
          return;
        }
        setState({ status: "ready", feed: data.feed });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "네트워크 오류로 신호를 불러오지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [keywords, demo]);

  return state;
}
