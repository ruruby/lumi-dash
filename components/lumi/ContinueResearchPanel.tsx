"use client";

import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ROTATING_PALETTE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { TopicMetrics } from "@/lib/trend-metrics";
import type { VisitRecord } from "@/lib/useVisitLog";

type ContinueResearchPanelProps = {
  topics: TopicMetrics[];
  visits: Record<string, VisitRecord>;
  onSelectTopic: (folder: string) => void;
};

export function ContinueResearchPanel({ topics, visits, onSelectTopic }: ContinueResearchPanelProps) {
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
        <div className="flex flex-wrap gap-2">
          {ordered.map((topic, index) => {
            const color = ROTATING_PALETTE[index % ROTATING_PALETTE.length];
            const visit = visits[topic.folder];
            const newNotes = visit ? topic.noteCount - visit.noteCountAtVisit : null;

            return (
              <div
                key={topic.folder + topic.topic}
                onClick={() => onSelectTopic(topic.folder)}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}44` }}
                className="cursor-pointer rounded-xl px-3 py-2 min-w-[128px]"
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#eceaf3" }} className="truncate">
                  {topic.topic}
                </div>
                <div style={{ fontSize: 9.5, color: TEXT_FAINT }} className="mt-1">
                  노트 {topic.noteCount}개
                  {newNotes !== null && newNotes > 0 && (
                    <span style={{ color, fontWeight: 700 }}> · 새 노트 {newNotes}개</span>
                  )}
                  {!visit && " · 아직 열지 않음"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
