import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { TopicStatus } from "@/lib/trend-metrics";
import type { KeywordExplanation } from "@/lib/overview-types";
import type { KeywordRadarEntry } from "@/lib/keyword-radar";

/**
 * 지금 주목할 기술 — one row per keyword mentioned across the user's
 * categories, not one row per category. Ranked by how often it was actually
 * mentioned recently (real notes, news, and Research Collector candidates),
 * so "emphasis" comes from frequency rather than a forced percentage —
 * see docs/decisions/derived-metrics-honesty.md.
 */
type ResearchRadarPanelProps = {
  entries: KeywordRadarEntry[];
  explanations: KeywordExplanation[];
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
  return "→";
}

export function ResearchRadarPanel({
  entries,
  explanations,
  windowDays,
  onSelectTopic,
  variant = "full",
  onOpenFull,
}: ResearchRadarPanelProps) {
  const whyByKeyword = new Map(explanations.map((e) => [e.keyword, e.why]));

  if (variant === "strip") {
    // Already ranked by mention frequency; keep that order so the busiest keywords lead.
    const ordered = entries;

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
            카테고리에 키워드를 등록하면 지금 주목할 기술을 보여드려요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ordered.map((entry) => {
              const style = STATUS_STYLE[entry.status];
              return (
                <button
                  key={entry.keyword}
                  onClick={() => entry.topicKeys[0] && onSelectTopic(entry.topicKeys[0])}
                  style={{ background: style.bg, border: `1px solid ${style.border}` }}
                  className="rounded-full px-2.5 py-1 flex items-center gap-1.5"
                >
                  <span style={{ fontSize: 10 }}>{style.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#eceaf3" }}>{entry.keyword}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: style.color }}>
                    {formatTrend(entry.trendPercent)}
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
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>최근 {windowDays}일 · 언급 빈도순</span>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리에 키워드를 등록하면 지금 주목할 기술을 보여드려요.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {entries.map((entry) => {
            const style = STATUS_STYLE[entry.status];
            const why = whyByKeyword.get(entry.keyword);
            return (
              <div
                key={entry.keyword}
                onClick={() => entry.topicKeys[0] && onSelectTopic(entry.topicKeys[0])}
                style={{ background: style.bg, border: `1px solid ${style.border}` }}
                className="cursor-pointer rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span style={{ fontSize: 11 }}>{style.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#eceaf3" }} className="truncate">
                      {entry.keyword}
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: style.color }}>{entry.status}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: style.color }} className="shrink-0">
                    {formatTrend(entry.trendPercent)}
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: TEXT_FAINT }} className="mt-1">
                  최근 언급 {entry.recentCount}건
                  {entry.priorCount > 0 && ` · 직전 ${entry.priorCount}건`}
                  {entry.topicKeys.length > 0 && ` · ${entry.topicKeys.join(", ")}`}
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
