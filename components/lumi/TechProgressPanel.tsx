"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ROTATING_PALETTE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import { TECH_STAGES, type TechProgressResult } from "@/lib/tech-progress-types";

type TechProgressPanelProps = {
  vaultPath: string;
  folder: string;
  vaultReady: boolean;
};

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: TechProgressResult };

export function TechProgressPanel({ vaultPath, folder, vaultReady }: TechProgressPanelProps) {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });

  async function handleAnalyze() {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/tech-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultPath, folder }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({ status: "error", message: data.error ?? "분석하지 못했어요." });
        return;
      }
      setState({ status: "success", result: data });
    } catch {
      setState({ status: "error", message: "네트워크 오류로 분석하지 못했어요." });
    }
  }

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
      <div className="flex items-center justify-between mb-1">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>기술 동향</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>LLM Wiki 기반 · 주제별 진행 현황</span>
      </div>

      {!vaultReady && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          Obsidian vault를 연결하면 정리해 둔 노트를 바탕으로 기술 동향을 분석해드려요.
        </p>
      )}

      {vaultReady && state.status === "idle" && (
        <button
          onClick={handleAnalyze}
          style={{ background: "linear-gradient(135deg, #c99a4b, #d9b06a)", color: "#0c0f1e" }}
          className="mt-4 self-start rounded-[11px] px-3.5 py-2 text-[12px] font-bold"
        >
          기술 동향 분석하기
        </button>
      )}

      {state.status === "loading" && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          노트를 읽고 분석하는 중... (로컬 claude CLI 호출이라 시간이 걸릴 수 있어요)
        </p>
      )}

      {state.status === "error" && (
        <div className="mt-4 flex flex-col gap-2 items-start">
          <p className="text-[12.5px]" style={{ color: "#e6a3a3" }}>
            {state.message}
          </p>
          <button onClick={handleAnalyze} style={{ color: "#a9bce4" }} className="text-[11px] font-semibold">
            다시 시도
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          {state.result.demo && (
            <span className="mt-2 self-start rounded-full border border-[#c99a4b]/35 bg-[#c99a4b]/10 px-2 py-1 text-[9.5px] font-bold text-[#e8c07f]">
              SAMPLE · 데모 분석
            </span>
          )}
          <div className="flex flex-col gap-3.5 mt-3">
            {state.result.items.map((item, index) => {
              const filled = TECH_STAGES.indexOf(item.stage) + 1;
              const dotColor = ROTATING_PALETTE[index % ROTATING_PALETTE.length];
              return (
                <div key={item.keyword}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: "#eceaf3" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
                      {item.keyword}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: dotColor }}>
                      {item.stage} 단계
                    </span>
                  </div>
                  <div className="flex gap-1 mb-1.5">
                    {[0, 1, 2, 3].map((segment) => (
                      <div
                        key={segment}
                        className="flex-1 rounded"
                        style={{
                          height: 6,
                          background: segment < filled ? dotColor : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-[10.5px]" style={{ color: "rgba(236,234,243,0.55)" }}>
                    {item.reason}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="mt-3.5 rounded-xl p-3 flex gap-2.5 items-start"
            style={{ background: "rgba(201,154,75,0.08)", border: "1px solid rgba(201,154,75,0.22)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8c07f" strokeWidth="2.4" className="shrink-0 mt-0.5">
              <path d="M12 3l1.9 4.6L18 9l-4.1 1.4L12 15l-1.9-4.6L6 9l4.1-1.4z" />
            </svg>
            <div className="text-[12px] leading-relaxed" style={{ color: "rgba(236,234,243,0.75)" }}>
              <b style={{ color: "#f0d6a0" }}>AI 요약</b> · {state.result.overview}
            </div>
          </div>
        </>
      )}
    </GlassPanel>
  );
}
