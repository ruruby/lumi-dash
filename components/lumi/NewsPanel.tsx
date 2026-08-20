"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { NewsFetchState } from "@/lib/useCategoryNews";

type NewsPanelProps = {
  categoryName: string | null;
  hasKeywords: boolean;
  state: NewsFetchState;
};

const ALL_SOURCES = "전체";
const SECURITY_NEWS_SOURCE = "보안뉴스";

export function NewsPanel({ categoryName, hasKeywords, state }: NewsPanelProps) {
  const [selectedSource, setSelectedSource] = useState<string>(ALL_SOURCES);

  const items = state.status === "success" ? state.items : [];

  // Reset the filter whenever the underlying news list changes (new category/keywords).
  useEffect(() => {
    setSelectedSource(ALL_SOURCES);
  }, [categoryName, items.length]);

  const filteredItems =
    selectedSource === ALL_SOURCES ? items : items.filter((item) => item.source === selectedSource);

  return (
    <GlassPanel className="w-full flex-1 min-h-0" hoverable cornerColor="#c99a4b">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
          {categoryName ? `${categoryName} 관련 뉴스` : "관련 뉴스"}
        </div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>Google 뉴스 · 자동 수집</span>
      </div>

      {!categoryName && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          왼쪽에서 카테고리를 선택하거나 새로 만들어보세요.
        </p>
      )}

      {categoryName && !hasKeywords && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          이 카테고리에 키워드를 추가하면 관련 뉴스를 모아드려요.
        </p>
      )}

      {categoryName && hasKeywords && state.status === "loading" && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          뉴스를 모으는 중...
        </p>
      )}

      {state.status === "error" && (
        <p className="mt-4 text-[12.5px]" style={{ color: "#e6a3a3" }}>
          {state.message}
        </p>
      )}

      {state.status === "success" && items.length === 0 && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          등록된 키워드와 관련된 뉴스를 찾지 못했어요.
        </p>
      )}

      {state.status === "success" && items.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mt-3 mb-1 shrink-0">
            <span style={{ fontSize: 10, color: TEXT_FAINT }} className="mr-0.5">
              출처
            </span>
            {[ALL_SOURCES, SECURITY_NEWS_SOURCE].map((source) => {
              const isActive = selectedSource === source;
              const count =
                source === ALL_SOURCES ? items.length : items.filter((item) => item.source === source).length;
              return (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  style={
                    isActive
                      ? {
                          background: "rgba(201,154,75,0.22)",
                          border: "1px solid rgba(201,154,75,0.5)",
                          color: "#f0d6a0",
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(236,234,243,0.6)",
                        }
                  }
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                >
                  {source} <span style={{ opacity: 0.65 }}>{count}</span>
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 ? (
            <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
              &ldquo;{selectedSource}&rdquo; 출처의 뉴스가 없어요.
            </p>
          ) : (
            <ul className="lumi-scroll mt-1 flex-1 min-h-0 overflow-y-auto flex flex-col pr-1">
              {filteredItems.map((item, index) => (
                <li
                  key={item.link}
                  style={{
                    borderBottom: index === filteredItems.length - 1 ? "none" : "1px solid rgba(255,255,255,0.07)",
                  }}
                  className="flex flex-col gap-1.5 py-3 shrink-0"
                >
                  <span
                    style={{
                      background: "rgba(201,154,75,0.16)",
                      color: "#e8c07f",
                      border: "1px solid rgba(201,154,75,0.32)",
                      width: "fit-content",
                    }}
                    className="text-[9.5px] font-bold px-2 py-1 rounded-lg"
                  >
                    💻 {item.source || "뉴스"}
                  </span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#eceaf3" }}
                    className="text-[13px] font-semibold leading-snug hover:underline"
                  >
                    {item.title}
                  </a>
                  <span style={{ color: "rgba(236,234,243,0.55)" }} className="text-[11px] leading-snug">
                    {item.summary}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </GlassPanel>
  );
}
