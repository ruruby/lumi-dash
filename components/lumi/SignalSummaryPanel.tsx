"use client";

import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ACCENT, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";

/**
 * The right-hand "AI Summary" card next to the Signal Feed. Reuses the same
 * whole-vault AI pass as LUMI Insights (one local `claude` CLI call produces
 * both) — see docs/decisions/local-claude-cli-runtime.md.
 */
type SignalSummaryPanelProps = {
  summary: string | null;
  loading: boolean;
  error: string | null;
  canRun: boolean;
  onRun: () => void;
};

export function SignalSummaryPanel({ summary, loading, error, canRun, onRun }: SignalSummaryPanelProps) {
  return (
    <GlassPanel className="w-full" hoverable cornerColor="#7a8ec4">
      <div className="mb-1 flex items-center justify-between shrink-0">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>AI Summary</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>신호 → 트렌드</span>
      </div>

      {loading && (
        <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          최근 신호를 훑어 트렌드를 정리하는 중... (로컬 claude CLI 호출이라 시간이 걸려요)
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

      {!loading && !summary && !error && (
        <>
          <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            AI가 보안뉴스·논문·기관 발행물을 훑어 지금 뜨는 흐름을 요약해드려요.
          </p>
          <button
            onClick={onRun}
            disabled={!canRun}
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #d9b06a)`, color: "#0c0f1e" }}
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

      {!loading && summary && (
        <>
          <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "rgba(236,234,243,0.8)" }}>
            &ldquo;{summary}&rdquo;
          </p>
          <button onClick={onRun} style={{ color: "#a9bce4" }} className="mt-3 self-start text-[10.5px] font-semibold">
            다시 분석
          </button>
        </>
      )}
    </GlassPanel>
  );
}
