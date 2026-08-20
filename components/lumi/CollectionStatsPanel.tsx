"use client";

import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import { useCollectionSummary } from "@/lib/useResearchInbox";

/**
 * Sits beside Research Radar: how much research material has actually been
 * gathered, broken down by source type. Every number is a stored count, real
 * across every category — no estimation, per
 * docs/decisions/derived-metrics-honesty.md.
 */
type CollectionStatsPanelProps = {
  /** Real news total, already computed by the overview pipeline. */
  newsCount: number;
  demo?: boolean;
};

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
      className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
    >
      <span style={{ fontSize: 10, color: TEXT_FAINT }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

export function CollectionStatsPanel({ newsCount, demo }: CollectionStatsPanelProps) {
  const state = useCollectionSummary(Boolean(demo));

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#7a8ec4">
      <div className="mb-2 flex items-center justify-between shrink-0">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>수집 통계</div>
        {state.status === "ready" && state.demo && (
          <span style={{ fontSize: 10, color: TEXT_FAINT }}>데모 데이터</span>
        )}
      </div>

      {state.status === "loading" && (
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
          통계를 읽는 중...
        </p>
      )}

      {state.status === "error" && <p className="text-[12px] text-[#e6a3a3]">{state.message}</p>}

      {state.status === "ready" && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="논문" value={state.summary.papers} color="#a9bce4" />
            <Stat label="기관 발행물" value={state.summary.organizations} color="#8fd3a6" />
            <Stat label="관련 뉴스" value={newsCount} color="#f0d6a0" />
            <Stat label="Wiki로 지식화" value={state.summary.addedToWiki} color="#c9a9d4" />
          </div>

          <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: TEXT_FAINT }}>
            {state.summary.lastCollectedAt
              ? `마지막 수집 · ${new Date(state.summary.lastCollectedAt).toLocaleString("ko-KR")}`
              : "아직 Research Collector를 실행한 적이 없어요."}
          </p>
        </>
      )}
    </GlassPanel>
  );
}
