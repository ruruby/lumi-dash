import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { TopicMetrics, TopicStatus } from "@/lib/trend-metrics";
import type { RadarExplanation } from "@/lib/overview-types";

type ResearchRadarPanelProps = {
  topics: TopicMetrics[];
  explanations: RadarExplanation[];
  windowDays: number;
  onSelectTopic: (folder: string) => void;
  /** "strip" is the condensed main-screen version: chips only, no explanations. */
  variant?: "full" | "strip";
  onOpenFull?: () => void;
};

const STATUS_STYLE: Record<TopicStatus, { icon: string; color: string; bg: string; border: string }> = {
  Hot: { icon: "🔥", color: "#e6a3a3", bg: "rgba(180,90,90,0.16)", border: "rgba(180,90,90,0.4)" },
  Emerging: { icon: "🌱", color: "#8fd1a6", bg: "rgba(95,168,118,0.16)", border: "rgba(95,168,118,0.4)" },
  Stable: { icon: "•", color: "#a9bce4", bg: "rgba(122,142,196,0.14)", border: "rgba(122,142,196,0.35)" },
  Declining: { icon: "↓", color: "rgba(236,234,243,0.55)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" },
};

function formatTrend(percent: number | null): string {
  if (percent === null) return "—";
  if (percent > 0) return `↑ ${percent}%`;
  if (percent < 0) return `↓ ${Math.abs(percent)}%`;
  return "→ 0%";
}

export function ResearchRadarPanel({
  topics,
  explanations,
  windowDays,
  onSelectTopic,
  variant = "full",
  onOpenFull,
}: ResearchRadarPanelProps) {
  const explanationByTopic = new Map(explanations.map((e) => [e.topic, e.why]));

  if (variant === "strip") {
    // Sort so the topics that are actually moving surface first.
    const ordered = [...topics].sort(
      (a, b) => (b.trendPercent ?? -Infinity) - (a.trendPercent ?? -Infinity),
    );

    return (
      <GlassPanel className="w-full" hoverable cornerColor="#c99a4b">
        <div className="flex items-center justify-between mb-2">
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Research Radar</div>
          {onOpenFull && (
            <button onClick={onOpenFull} style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }}>
              동향 전체 보기 ›
            </button>
          )}
        </div>

        {ordered.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
            카테고리를 만들면 관심 기술의 추세를 보여드려요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ordered.map((topic) => {
              const style = STATUS_STYLE[topic.status];
              return (
                <button
                  key={topic.folder + topic.topic}
                  onClick={() => onSelectTopic(topic.folder)}
                  style={{ background: style.bg, border: `1px solid ${style.border}` }}
                  className="rounded-full px-2.5 py-1 flex items-center gap-1.5"
                >
                  <span style={{ fontSize: 10 }}>{style.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#eceaf3" }}>{topic.topic}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: style.color }}>
                    {formatTrend(topic.trendPercent)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
      <div className="flex items-center justify-between mb-1">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Research Radar</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>최근 {windowDays}일 · 직전 동기간 대비</span>
      </div>

      {topics.length === 0 ? (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리를 만들면 관심 기술의 추세를 보여드려요.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {topics.map((topic) => {
            const style = STATUS_STYLE[topic.status];
            const why = explanationByTopic.get(topic.topic);
            return (
              <div
                key={topic.folder + topic.topic}
                onClick={() => onSelectTopic(topic.folder)}
                style={{ background: style.bg, border: `1px solid ${style.border}` }}
                className="cursor-pointer rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span style={{ fontSize: 11 }}>{style.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#eceaf3" }} className="truncate">
                      {topic.topic}
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: style.color }}>{topic.status}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: style.color }} className="shrink-0">
                    {formatTrend(topic.trendPercent)}
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: TEXT_FAINT }} className="mt-1">
                  노트 {topic.recentNotes} · 뉴스 {topic.recentNews}
                  {topic.trendPercent === null && " · 비교할 직전 자료 없음"}
                </div>
                {why && (
                  <div style={{ fontSize: 10.5, color: "rgba(236,234,243,0.6)" }} className="mt-1.5 leading-snug">
                    {why}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
