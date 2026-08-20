import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { LumiInsights } from "@/lib/overview-types";

type LumiInsightsPanelProps = {
  insights: LumiInsights | null;
  loading: boolean;
  error: string | null;
  canRun: boolean;
  onRun: () => void;
};

const FIELDS: { key: keyof LumiInsights; label: string; color: string }[] = [
  { key: "emergingTopic", label: "Emerging Topic", color: "#8fd1a6" },
  { key: "suggestedKeyword", label: "Suggested Keyword", color: "#e8c07f" },
  { key: "researchGap", label: "Research Gap", color: "#e6a3a3" },
  { key: "newConnection", label: "New Connection", color: "#a9bce4" },
];

export function LumiInsightsPanel({ insights, loading, error, canRun, onRun }: LumiInsightsPanelProps) {
  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
      <div className="flex items-center justify-between mb-1">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>LUMI Insights</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>전체 관심 분야 종합</span>
      </div>

      {loading && (
        <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          전체 자료를 분석하는 중... (로컬 claude CLI 호출이라 시간이 걸려요)
        </p>
      )}

      {!loading && error && (
        <div className="mt-3 flex flex-col items-start gap-2">
          <p className="text-[12px]" style={{ color: "#e6a3a3" }}>
            {error}
          </p>
          {canRun && (
            <button onClick={onRun} style={{ color: "#a9bce4" }} className="text-[11px] font-semibold">
              다시 분석
            </button>
          )}
        </div>
      )}

      {!loading && !insights && !error && (
        <>
          <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            AI가 전체 관심 분야를 훑어 주목할 변화를 먼저 짚어드려요.
          </p>
          <button
            onClick={onRun}
            disabled={!canRun}
            style={{ background: "linear-gradient(135deg, #c99a4b, #d9b06a)", color: "#0c0f1e" }}
            className="mt-3 self-start rounded-[11px] px-3.5 py-2 text-[12px] font-bold disabled:opacity-40"
          >
            AI 분석 실행
          </button>
          {!canRun && (
            <p className="mt-1.5 text-[10px]" style={{ color: TEXT_FAINT }}>
              vault를 연결하고 카테고리를 만들면 실행할 수 있어요.
            </p>
          )}
        </>
      )}

      {!loading && insights && (
        <>
          <div className="flex flex-col gap-2.5 mt-2">
            {FIELDS.map((field) => {
              const value = insights[field.key];
              if (!value) return null;
              return (
                <div key={field.key}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: field.color }}>{field.label}</div>
                  <div
                    style={{ fontSize: 11, color: "rgba(236,234,243,0.72)" }}
                    className="mt-0.5 leading-snug"
                  >
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={onRun}
            style={{ color: "#a9bce4" }}
            className="mt-3 self-start text-[10.5px] font-semibold"
          >
            다시 분석
          </button>
        </>
      )}
    </GlassPanel>
  );
}
