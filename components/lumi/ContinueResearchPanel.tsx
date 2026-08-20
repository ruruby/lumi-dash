"use client";

import { useMemo } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ROTATING_PALETTE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { TopicMetrics } from "@/lib/trend-metrics";
import type { VisitRecord } from "@/lib/useVisitLog";

type ContinueResearchPanelProps = {
  topics: TopicMetrics[];
  visits: Record<string, VisitRecord>;
  /** Unreviewed Research Collector candidates per topic folder — real counts, not estimates. */
  inboxCounts?: Record<string, number>;
  onSelectTopic: (folder: string) => void;
};

/** "오늘" / "어제" / "N일 전", matching how far back the visit actually was. */
function formatRelativeVisit(timestamp: number, now: number): string {
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((now - timestamp) / dayMs);
  if (days <= 0) return "오늘 봄";
  if (days === 1) return "어제 봄";
  return `${days}일 전 봄`;
}

export function ContinueResearchPanel({ topics, visits, inboxCounts, onSelectTopic }: ContinueResearchPanelProps) {
  // Computed once per mount, same as VaultContributionPanel's calendar — a
  // relative-time display, not a ticking clock.
  const now = useMemo(() => new Date().getTime(), []);

  // Most recently opened first; never-opened topics fall to the end.
  const ordered = [...topics].sort(
    (a, b) => (visits[b.folder]?.lastVisitedAt ?? 0) - (visits[a.folder]?.lastVisitedAt ?? 0),
  );

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#7a8ec4">
      <div className="flex items-center justify-between mb-2">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Continue Research</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>최근 본 주제부터</span>
      </div>

      {ordered.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리를 만들면 이어서 볼 주제를 모아드려요.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ordered.map((topic, index) => {
            const color = ROTATING_PALETTE[index % ROTATING_PALETTE.length];
            const visit = visits[topic.folder];
            const newNotes = visit ? topic.noteCount - visit.noteCountAtVisit : null;
            const newSources = inboxCounts?.[topic.folder] ?? 0;

            // One status per card, most actionable first — new external
            // candidates, then vault growth since the last visit, then just
            // when it was last opened.
            let status: { text: string; color?: string };
            if (newSources > 0) {
              status = { text: `새 자료 ${newSources}건`, color };
            } else if (newNotes !== null && newNotes > 0) {
              status = { text: `새 노트 ${newNotes}개`, color };
            } else if (visit) {
              status = { text: formatRelativeVisit(visit.lastVisitedAt, now) };
            } else {
              status = { text: "아직 열지 않음" };
            }

            return (
              <button
                key={topic.folder + topic.topic}
                onClick={() => onSelectTopic(topic.folder)}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left"
              >
                <div className="min-w-0">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#eceaf3" }} className="truncate">
                    {topic.topic}
                  </div>
                  <div style={{ fontSize: 10, color: TEXT_FAINT }} className="mt-0.5">
                    노트 {topic.noteCount}개
                  </div>
                </div>
                <span
                  style={{ color: status.color ?? TEXT_FAINT, fontWeight: status.color ? 700 : 500 }}
                  className="shrink-0 pl-2 text-[10.5px] whitespace-nowrap"
                >
                  {status.text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
