"use client";

import { useMemo } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { SignalFeedState } from "@/lib/useSignalFeed";
import type { SignalLane } from "@/lib/signal-types";

type SignalFeedPanelProps = {
  hasKeywords: boolean;
  state: SignalFeedState;
};

const LANE_META: Record<SignalLane, { label: string; icon: string; color: string; bg: string; border: string }> = {
  security: { label: "Security News", icon: "🔴", color: "#e6a3a3", bg: "rgba(180,90,90,0.14)", border: "rgba(180,90,90,0.32)" },
  research: { label: "Research", icon: "📄", color: "#a9bce4", bg: "rgba(122,142,196,0.14)", border: "rgba(122,142,196,0.32)" },
  industry: { label: "Industry", icon: "🏛", color: "#8fd3a6", bg: "rgba(95,168,118,0.14)", border: "rgba(95,168,118,0.32)" },
  community: { label: "Community", icon: "💬", color: "rgba(236,234,243,0.5)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)" },
};

/** "N시간 전" / "N일 전" — always from a real timestamp, never estimated. */
function formatRelativeTime(at: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - at) / (60 * 1000)));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function SignalFeedPanel({ hasKeywords, state }: SignalFeedPanelProps) {
  // Computed once per mount, same as VaultContributionPanel's calendar — a
  // relative-time display, not a ticking clock.
  const now = useMemo(() => new Date().getTime(), []);

  return (
    <GlassPanel className="w-full flex-1 min-h-0" hoverable cornerColor="#c99a4b">
      <div className="mb-2 flex items-center justify-between shrink-0">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>News & Signals</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>
          {state.status === "ready" && state.demo ? "샘플 데이터" : "보안뉴스 · 논문 · 기관 발행물"}
        </span>
      </div>

      {!hasKeywords && state.status !== "ready" && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리에 키워드를 추가하면 관련 신호를 모아드려요.
        </p>
      )}

      {state.status === "loading" && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          신호를 모으는 중...
        </p>
      )}

      {state.status === "error" && (
        <p className="mt-4 text-[12.5px]" style={{ color: "#e6a3a3" }}>
          {state.message}
        </p>
      )}

      {state.status === "ready" && (
        <>
          {state.feed.items.length === 0 ? (
            <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
              아직 모인 신호가 없어요. 카테고리에 키워드를 추가하거나 Research Inbox에서 자료 수집을
              실행해보세요.
            </p>
          ) : (
            <ul className="lumi-scroll mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
              {state.feed.items.map((item, index) => {
                const meta = LANE_META[item.lane];
                return (
                  <li
                    key={item.id}
                    style={{
                      borderBottom:
                        index === state.feed.items.length - 1 ? "none" : "1px solid rgba(255,255,255,0.07)",
                    }}
                    className="flex flex-col gap-1.5 py-3 shrink-0"
                  >
                    <span
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, width: "fit-content" }}
                      className="text-[9.5px] font-bold px-2 py-1 rounded-lg"
                    >
                      {meta.icon} {meta.label}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#eceaf3" }}
                      className="text-[12.5px] font-semibold leading-snug hover:underline"
                    >
                      {item.title}
                    </a>
                    <span style={{ color: "rgba(236,234,243,0.5)" }} className="text-[10.5px]">
                      {item.sourceLabel} · {formatRelativeTime(item.at, now)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 shrink-0">
            {(Object.keys(LANE_META) as SignalLane[]).map((lane) => {
              const meta = LANE_META[lane];
              const count = state.feed.laneCounts[lane];
              const truncated = state.feed.laneTruncated[lane];
              return (
                <span key={lane} style={{ fontSize: 9.5, color: TEXT_FAINT }}>
                  {meta.icon} {meta.label}{" "}
                  {lane === "community" ? "· 아직 수집하지 않음" : `${count}건${truncated ? "+" : ""}`}
                </span>
              );
            })}
          </div>
        </>
      )}
    </GlassPanel>
  );
}
