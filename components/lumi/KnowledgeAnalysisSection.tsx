"use client";

import { useState } from "react";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { KnowledgeAnalysis } from "@/lib/knowledge-analysis";

type KnowledgeAnalysisSectionProps = {
  vaultPath: string;
  folder: string;
  ready: boolean;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; analysis: KnowledgeAnalysis };

const GROUPS: { key: keyof KnowledgeAnalysis; label: string; color: string }[] = [
  { key: "stronglyConnected", label: "Strongly Connected", color: "#8fd1a6" },
  { key: "growing", label: "Growing", color: "#e8c07f" },
  { key: "knowledgeGap", label: "Knowledge Gap", color: "#e6a3a3" },
];

export function KnowledgeAnalysisSection({ vaultPath, folder, ready }: KnowledgeAnalysisSectionProps) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleAnalyze() {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/knowledge-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultPath, folder }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({ status: "error", message: data.error ?? "분석하지 못했어요." });
        return;
      }
      setState({ status: "success", analysis: data });
    } catch {
      setState({ status: "error", message: "네트워크 오류로 분석하지 못했어요." });
    }
  }

  if (!ready) return null;

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff" }} className="mb-1.5">
        Knowledge 분석
      </div>

      {state.status === "idle" && (
        <button
          onClick={handleAnalyze}
          style={{ background: "rgba(122,142,196,0.28)", color: "#a9bce4" }}
          className="rounded-[10px] px-3 py-1.5 text-[11px] font-bold"
        >
          지식 구조 분석하기
        </button>
      )}

      {state.status === "loading" && (
        <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>
          노트의 연결 관계를 분석하는 중...
        </p>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-[11.5px]" style={{ color: "#e6a3a3" }}>
            {state.message}
          </p>
          <button onClick={handleAnalyze} style={{ color: "#a9bce4" }} className="text-[10.5px] font-semibold">
            다시 시도
          </button>
        </div>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-2.5">
          {GROUPS.map((group) => {
            const items = state.analysis[group.key] as string[];
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: group.color }}>{group.label}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {items.map((item) => (
                    <span
                      key={item}
                      style={{
                        background: `${group.color}1f`,
                        border: `1px solid ${group.color}55`,
                        color: group.color,
                      }}
                      className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {state.analysis.newConnection && (
            <div
              className="rounded-xl p-2.5 flex gap-2 items-start"
              style={{ background: "rgba(122,142,196,0.1)", border: "1px solid rgba(122,142,196,0.28)" }}
            >
              <span style={{ fontSize: 10, color: "#a9bce4" }} className="shrink-0 mt-0.5">
                ✦
              </span>
              <div className="text-[11px] leading-snug" style={{ color: "rgba(236,234,243,0.72)" }}>
                <b style={{ color: "#a9bce4" }}>New Connection</b> · {state.analysis.newConnection}
              </div>
            </div>
          )}

          <button onClick={handleAnalyze} style={{ color: TEXT_FAINT }} className="self-start text-[10px]">
            다시 분석
          </button>
        </div>
      )}
    </div>
  );
}
