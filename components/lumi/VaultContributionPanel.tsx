"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";

type Activity = {
  days: Record<string, number>;
  totalUpdates: number;
  activeDays: number;
  currentStreak: number;
};

type ActivityState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; activity: Activity };

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_COUNT = 26;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function level(count: number): string {
  if (count >= 4) return "bg-[#c99a4b]";
  if (count >= 3) return "bg-[#9f783d]";
  if (count >= 2) return "bg-[#6d542f]";
  if (count >= 1) return "bg-[#403625]";
  return "bg-white/[0.06]";
}

export function VaultContributionPanel({ vaultPath }: { vaultPath: string }) {
  const [state, setState] = useState<ActivityState>(() =>
    vaultPath ? { status: "loading" } : { status: "error", message: "먼저 Obsidian vault를 연결해 주세요." },
  );

  useEffect(() => {
    if (!vaultPath) {
      return;
    }

    let cancelled = false;
    fetch(`/api/vault?mode=activity&path=${encodeURIComponent(vaultPath)}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({ status: "error", message: data.error ?? "Vault 활동을 읽지 못했어요." });
          return;
        }
        setState({ status: "ready", activity: data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "네트워크 오류로 Vault 활동을 읽지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath]);

  const calendar = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const start = new Date(end.getTime() - (WEEK_COUNT * 7 - 1) * DAY_MS);
    return Array.from({ length: WEEK_COUNT }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => new Date(start.getTime() + (week * 7 + day) * DAY_MS)),
    );
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-[15px] font-bold text-white">Vault 활동</div>
            <p className="mt-1 text-[11px] text-white/50">노트를 개선한 날을 잔디로 기록합니다.</p>
          </div>
          <div className="rounded-full border border-[#c99a4b]/35 bg-[#c99a4b]/10 px-2.5 py-1 text-[10px] font-bold text-[#e8c07f]">
            26주 기록
          </div>
        </div>

        {state.status === "loading" && <p className="mt-6 text-[12px] text-white/50">Vault 활동을 계산하는 중...</p>}
        {state.status === "error" && <p className="mt-6 text-[12px] text-[#e6a3a3]">{state.message}</p>}
        {state.status === "ready" && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat label="개선 노트" value={`${state.activity.totalUpdates}개`} />
              <Stat label="활동 일수" value={`${state.activity.activeDays}일`} />
              <Stat label="현재 연속" value={`${state.activity.currentStreak}일`} />
            </div>

            <div className="mt-7 overflow-x-auto pb-1">
              <div className="flex min-w-[760px] gap-1.5">
                <div className="grid grid-rows-7 gap-1 self-start pr-1 pt-0.5 text-[9px] text-white/35">
                  <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                </div>
                <div className="flex gap-1">
                  {calendar.map((week) => (
                    <div key={dateKey(week[0])} className="grid grid-rows-7 gap-1">
                      {week.map((date) => {
                        const count = state.activity.days[dateKey(date)] ?? 0;
                        return (
                          <span
                            key={dateKey(date)}
                            title={`${dateKey(date)} · 개선 노트 ${count}개`}
                            className={`h-3.5 w-3.5 rounded-[3px] ${level(count)}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[9.5px] text-white/40">
              적음
              {[0, 1, 2, 3, 4].map((count) => <span key={count} className={`h-3.5 w-3.5 rounded-[3px] ${level(count)}`} />)}
              많음
            </div>
          </>
        )}
      </GlassPanel>
      <GlassPanel className="w-full flex-1" fill hoverable cornerColor="#7a8ec4">
        <div className="text-[13.5px] font-bold text-white">기록 기준</div>
        <p className="mt-3 text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>
          각 노트의 frontmatter <code className="text-[#e8c07f]">updated</code> 날짜를 우선 사용하고, 날짜가 없으면 파일 수정 시각을 사용합니다. 하루에 업데이트한 노트 수가 많을수록 잔디가 진해집니다.
        </p>
        <p className="mt-3 text-[10.5px]" style={{ color: TEXT_FAINT }}>
          실제 Vault 파일의 변경 기록을 기반으로 계산되며, Git 커밋 수와는 다릅니다.
        </p>
      </GlassPanel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[10px] text-white/40">{label}</div>
      <div className="mt-1 text-[18px] font-bold text-[#f0d6a0]">{value}</div>
    </div>
  );
}
