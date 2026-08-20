import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ROTATING_PALETTE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { TopicMetrics } from "@/lib/trend-metrics";
import type { ChangeSummary } from "@/lib/overview-types";

type WhatChangedPanelProps = {
  topics: TopicMetrics[];
  summaries: ChangeSummary[];
  windowDays: number;
  onChangeWindow: (days: number) => void;
};

const WINDOW_OPTIONS = [7, 14, 30];

export function WhatChangedPanel({
  topics,
  summaries,
  windowDays,
  onChangeWindow,
}: WhatChangedPanelProps) {
  const summaryByTopic = new Map(summaries.map((s) => [s.topic, s.summary]));

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
      <div className="flex items-center justify-between mb-2">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>What Changed</div>
        <div className="flex items-center gap-1">
          {WINDOW_OPTIONS.map((days) => {
            const isActive = days === windowDays;
            return (
              <button
                key={days}
                onClick={() => onChangeWindow(days)}
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
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              >
                {days}일
              </button>
            );
          })}
        </div>
      </div>

      {topics.length === 0 ? (
        <p className="mt-2 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리를 만들면 최근 변화를 정리해드려요.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic, index) => {
            const color = ROTATING_PALETTE[index % ROTATING_PALETTE.length];
            const summary = summaryByTopic.get(topic.topic);
            const total = topic.recentNotes + topic.recentNews;

            return (
              <div key={topic.folder + topic.topic}>
                <div className="flex items-center gap-1.5">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#eceaf3" }}>{topic.topic}</span>
                </div>
                <div style={{ fontSize: 10.5, color: color }} className="mt-1">
                  {total === 0
                    ? `최근 ${windowDays}일 새 자료 없음`
                    : `노트 ${topic.recentNotes}건 · 뉴스 ${topic.recentNews}건`}
                </div>
                {summary && (
                  <div style={{ fontSize: 10.5, color: "rgba(236,234,243,0.6)" }} className="mt-1 leading-snug">
                    {summary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[9.5px]" style={{ color: TEXT_FAINT }}>
        노트 수정 시각과 뉴스 게시 시각에서 계산한 값이에요.
      </p>
    </GlassPanel>
  );
}
