"use client";

import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import { useCollectorStatus } from "@/lib/useResearchInbox";

/**
 * Collector activity summary, shown next to Vault 활동: when each category
 * last ran a collection and where its candidates currently stand. Every
 * number is a stored count — never estimated — per
 * docs/decisions/derived-metrics-honesty.md.
 */
export function CollectorStatusPanel({ demo }: { demo?: boolean }) {
  const state = useCollectorStatus(Boolean(demo));

  const mostRecent =
    state.status === "ready"
      ? state.topics.reduce<number | null>(
          (latest, topic) => (topic.lastRunAt !== null && (latest === null || topic.lastRunAt > latest) ? topic.lastRunAt : latest),
          null,
        )
      : null;

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#7a8ec4">
      <div className="mb-1 flex items-center justify-between shrink-0">
        <div className="text-[13.5px] font-bold text-white">Research Collector 현황</div>
        {state.status === "ready" && state.demo && (
          <span style={{ fontSize: 10, color: TEXT_FAINT }}>데모 데이터</span>
        )}
      </div>

      <p className="mb-4 text-[11px] leading-relaxed" style={{ color: TEXT_MUTED }}>
        {mostRecent
          ? `가장 최근 수집 · ${new Date(mostRecent).toLocaleString("ko-KR")}`
          : "아직 수집을 실행한 카테고리가 없어요."}
      </p>

      {state.status === "loading" && (
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
          수집 현황을 읽는 중...
        </p>
      )}

      {state.status === "error" && <p className="text-[12px] text-[#e6a3a3]">{state.message}</p>}

      {state.status === "ready" && state.topics.length === 0 && (
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
          Research Inbox에서 자료 수집을 실행하면 여기에 카테고리별 현황이 쌓여요.
        </p>
      )}

      {state.status === "ready" && state.topics.length > 0 && (
        <ul className="lumi-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {state.topics.map((topic) => (
            <li
              key={topic.topicKey}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
              className="shrink-0 rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-white">
                  {topic.topicKey || "(vault 루트)"}
                </span>
                <span style={{ fontSize: 9.5, color: TEXT_FAINT }} className="shrink-0">
                  {topic.lastRunAt ? new Date(topic.lastRunAt).toLocaleDateString("ko-KR") : "수집 전"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge label="신규" value={topic.new} color="#f0d6a0" />
                <Badge label="중요" value={topic.important} color="#a9bce4" />
                <Badge label="나중에" value={topic.readLater} color="rgba(236,234,243,0.7)" />
                <Badge label="지식화" value={topic.added} color="#8fd3a6" />
                <Badge label="무시" value={topic.ignored} color="#e6a3a3" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

function Badge({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <span
      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${color}55`, color }}
      className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold"
    >
      {label} {value}
    </span>
  );
}
