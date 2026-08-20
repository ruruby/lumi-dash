"use client";

import { useEffect, useState } from "react";

export type NewsResult = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  summary: string;
};

export type NewsFetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: NewsResult[] };

export function useCategoryNews(keywords: string[]): NewsFetchState {
  const [state, setState] = useState<NewsFetchState>({ status: "idle" });

  useEffect(() => {
    if (keywords.length === 0) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    const keywordsParam = encodeURIComponent(keywords.join(","));
    fetch(`/api/news?keywords=${keywordsParam}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({ status: "error", message: data.error ?? "뉴스를 가져오지 못했어요." });
          return;
        }
        setState({ status: "success", items: data.items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "네트워크 오류로 뉴스를 가져오지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [keywords]);

  return state;
}
