"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { WikiDraftModal } from "@/components/lumi/WikiDraftModal";
import { ACCENT, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import { RELEVANCE_THRESHOLD, type Candidate, type CandidateStatus, type WikiNoteDraft } from "@/lib/research-types";
import type { useResearchInbox } from "@/lib/useResearchInbox";

type Inbox = ReturnType<typeof useResearchInbox>;

type ResearchInboxPanelProps = {
  categoryName: string | null;
  hasKeywords: boolean;
  targetFolder: string;
  vaultConnected: boolean;
  inbox: Inbox;
};

const STATUS_LABELS: Record<CandidateStatus, string> = {
  new: "신규",
  important: "중요",
  readLater: "나중에",
  added: "지식화됨",
  ignored: "무시",
};

/** Score colour bands. The number is an AI judgement, so it is always shown with its reason. */
function scoreColor(score: number): string {
  if (score >= 80) return "#8fd3a6";
  if (score >= 60) return "#e8c07f";
  if (score >= RELEVANCE_THRESHOLD) return "#c9a9d4";
  return "rgba(236,234,243,0.5)";
}

function formatDate(value: string | null): string {
  if (!value) return "발행일 미상";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString("ko-KR");
}

export function ResearchInboxPanel({
  categoryName,
  hasKeywords,
  targetFolder,
  vaultConnected,
  inbox,
}: ResearchInboxPanelProps) {
  const { state, collectState, collect, act, requestDraft, saveDraft } = inbox;

  const [showLowRelevance, setShowLowRelevance] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draft, setDraft] = useState<WikiNoteDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const candidates = state.status === "ready" ? state.candidates : [];
  const demo = state.status === "ready" && state.demo === true;

  const relevant = candidates.filter((c) => (c.analysis?.score ?? 100) >= RELEVANCE_THRESHOLD);
  const lowRelevance = candidates.filter((c) => (c.analysis?.score ?? 100) < RELEVANCE_THRESHOLD);
  const visible = showLowRelevance ? [...relevant, ...lowRelevance] : relevant;

  async function handleAddToWiki(candidate: Candidate) {
    setDraftOpen(true);
    setDraftLoading(true);
    setDraft(null);
    setDraftError(null);

    const result = await requestDraft(candidate);
    setDraftLoading(false);
    if ("error" in result) {
      setDraftError(result.error);
      return;
    }
    setDraft(result);
  }

  return (
    <>
      <GlassPanel className="w-full flex-1 min-h-0" hoverable cornerColor="#c99a4b">
        <div className="mb-2 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
              Research Inbox{categoryName ? ` · ${categoryName}` : ""}
            </div>
            <div style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mt-0.5">
              {demo
                ? "샘플 후보 자료 · 데모 데이터"
                : "OpenAlex 논문 + 기관 공식 피드 · 선택한 자료만 Wiki로"}
            </div>
          </div>

          <button
            onClick={() => void collect()}
            disabled={!categoryName || !hasKeywords || collectState.status === "running"}
            style={{
              background:
                !categoryName || !hasKeywords
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(160deg, ${ACCENT}, rgba(201,154,75,0.65))`,
              color: !categoryName || !hasKeywords ? "rgba(236,234,243,0.4)" : "#1a1206",
              border: "1px solid rgba(201,154,75,0.35)",
            }}
            className="shrink-0 rounded-[10px] px-3 py-1.5 text-[11px] font-bold"
          >
            {collectState.status === "running" ? "수집 중..." : "자료 수집"}
          </button>
        </div>

        {!categoryName && (
          <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            왼쪽에서 카테고리를 선택하면 그 주제의 후보 자료를 모아드려요.
          </p>
        )}

        {categoryName && !hasKeywords && (
          <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            이 카테고리에 키워드를 추가하면 관련 논문과 기관 발행물을 찾아드려요.
          </p>
        )}

        {collectState.status === "error" && (
          <p className="mt-3 text-[12.5px]" style={{ color: "#e6a3a3" }}>
            {collectState.message}
          </p>
        )}

        {collectState.status === "done" && (
          <div
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            className="mb-3 shrink-0 rounded-xl px-3 py-2"
          >
            <div style={{ fontSize: 11.5, color: "rgba(236,234,243,0.8)" }}>
              {collectState.result.found}건 발견 · {collectState.result.added}건 신규 ·{" "}
              {collectState.result.duplicates}건 중복 제거
              {collectState.result.searchesUsed > 0 && ` · 검색 ${collectState.result.searchesUsed}회`}
            </div>
            {collectState.result.analysisSkipped && (
              <div style={{ fontSize: 10.5, color: "#f0d6a0" }} className="mt-1">
                AI 분석 없음 — 로컬 claude CLI를 찾지 못해 점수와 요약이 비어 있어요.
              </div>
            )}
            {collectState.result.analysisCallsFailed && (
              <div style={{ fontSize: 10.5, color: "#f0d6a0" }} className="mt-1">
                AI 분석 실패 — claude CLI는 찾았지만 응답을 받지 못해 점수와 요약이 비어 있어요.
              </div>
            )}
            {collectState.result.budgetExhausted && (
              <div style={{ fontSize: 10.5, color: "#f0d6a0" }} className="mt-1">
                키워드가 많아 이번 실행에서는 앞쪽 키워드만 검색했어요.
              </div>
            )}
            {collectState.result.warnings.map((warning) => (
              <div key={warning} style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mt-1">
                {warning}
              </div>
            ))}
          </div>
        )}

        {state.status === "loading" && (
          <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            후보 자료를 읽는 중...
          </p>
        )}

        {state.status === "error" && (
          <p className="mt-4 text-[12.5px]" style={{ color: "#e6a3a3" }}>
            {state.message}
          </p>
        )}

        {state.status === "ready" && candidates.length === 0 && (
          <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            아직 검토할 후보 자료가 없어요. 위의 &ldquo;자료 수집&rdquo;을 눌러보세요.
          </p>
        )}

        {visible.length > 0 && (
          <ul className="lumi-scroll mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
            {visible.map((candidate) => {
              const score = candidate.analysis?.score ?? null;
              return (
                <li
                  key={candidate.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  className="flex shrink-0 flex-col gap-1.5 py-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      style={{
                        background:
                          candidate.sourceType === "paper"
                            ? "rgba(122,142,196,0.18)"
                            : "rgba(95,168,118,0.16)",
                        color: candidate.sourceType === "paper" ? "#a9bce4" : "#8fd3a6",
                        border: `1px solid ${
                          candidate.sourceType === "paper"
                            ? "rgba(122,142,196,0.35)"
                            : "rgba(95,168,118,0.35)"
                        }`,
                      }}
                      className="rounded-lg px-2 py-0.5 text-[9.5px] font-bold"
                    >
                      {candidate.sourceType === "paper" ? "📄 논문" : "🏛 기관 발행물"}
                    </span>

                    {candidate.venue && (
                      <span style={{ fontSize: 9.5, color: TEXT_FAINT }} className="max-w-[160px] truncate">
                        {candidate.venue}
                      </span>
                    )}

                    <span style={{ fontSize: 9.5, color: TEXT_FAINT }}>{formatDate(candidate.publishedAt)}</span>

                    {candidate.status !== "new" && (
                      <span
                        style={{
                          background: "rgba(201,154,75,0.16)",
                          color: "#f0d6a0",
                          border: "1px solid rgba(201,154,75,0.3)",
                        }}
                        className="rounded-lg px-1.5 py-0.5 text-[9px] font-bold"
                      >
                        {STATUS_LABELS[candidate.status]}
                      </span>
                    )}

                    <span className="ml-auto flex items-center gap-1">
                      {score === null ? (
                        <span style={{ fontSize: 9.5, color: TEXT_FAINT }}>AI 분석 없음</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 9, color: TEXT_FAINT }}>AI 관련성</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#eceaf3" }}
                    className="text-[13px] font-semibold leading-snug hover:underline"
                  >
                    {candidate.title}
                  </a>

                  {candidate.authors.length > 0 && (
                    <span style={{ fontSize: 10.5, color: TEXT_FAINT }} className="truncate">
                      {candidate.authors.join(", ")}
                      {typeof candidate.citedByCount === "number" && ` · 인용 ${candidate.citedByCount}`}
                    </span>
                  )}

                  {candidate.analysis?.summary && (
                    <span style={{ color: "rgba(236,234,243,0.62)" }} className="text-[11px] leading-snug">
                      {candidate.analysis.summary}
                    </span>
                  )}

                  {candidate.analysis?.reason && (
                    <span
                      style={{
                        color: "rgba(236,234,243,0.5)",
                        borderLeft: "2px solid rgba(201,154,75,0.4)",
                      }}
                      className="pl-2 text-[10.5px] leading-snug"
                    >
                      이 점수를 준 이유 · {candidate.analysis.reason}
                    </span>
                  )}

                  <span style={{ fontSize: 9.5, color: TEXT_FAINT }}>발견 경로 · {candidate.foundVia}</span>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => void handleAddToWiki(candidate)}
                      disabled={!vaultConnected && !demo}
                      title={!vaultConnected && !demo ? "먼저 vault를 연결해주세요." : undefined}
                      style={{
                        background: "rgba(201,154,75,0.2)",
                        border: "1px solid rgba(201,154,75,0.45)",
                        color: "#f0d6a0",
                        opacity: !vaultConnected && !demo ? 0.45 : 1,
                      }}
                      className="rounded-lg px-2.5 py-1 text-[10.5px] font-bold"
                    >
                      Add to Wiki
                    </button>
                    <button
                      onClick={() => void act(candidate.id, "important")}
                      style={{
                        background: "rgba(122,142,196,0.16)",
                        border: "1px solid rgba(122,142,196,0.35)",
                        color: "#a9bce4",
                      }}
                      className="rounded-lg px-2.5 py-1 text-[10.5px] font-semibold"
                    >
                      Important
                    </button>
                    <button
                      onClick={() => void act(candidate.id, "readLater")}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(236,234,243,0.7)",
                      }}
                      className="rounded-lg px-2.5 py-1 text-[10.5px] font-semibold"
                    >
                      Read Later
                    </button>
                    <button
                      onClick={() => void act(candidate.id, "ignored")}
                      style={{
                        background: "rgba(180,90,90,0.14)",
                        border: "1px solid rgba(180,90,90,0.32)",
                        color: "#e6a3a3",
                      }}
                      className="rounded-lg px-2.5 py-1 text-[10.5px] font-semibold"
                    >
                      Ignore
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {lowRelevance.length > 0 && (
          <button
            onClick={() => setShowLowRelevance((current) => !current)}
            style={{ color: TEXT_FAINT }}
            className="mt-2 shrink-0 text-left text-[10.5px] hover:underline"
          >
            {showLowRelevance
              ? "관련성 낮은 자료 접기"
              : `관련성 ${RELEVANCE_THRESHOLD}점 미만 ${lowRelevance.length}건 펼치기`}
          </button>
        )}
      </GlassPanel>

      {/* Keyed per draft so each one opens with its own title and body. */}
      <WikiDraftModal
        key={draft?.candidateId ?? "pending"}
        open={draftOpen}
        onClose={() => setDraftOpen(false)}
        loading={draftLoading}
        draft={draft}
        error={draftError}
        targetFolder={targetFolder}
        onSave={(title, markdown) =>
          draft ? saveDraft(draft, title, markdown) : Promise.resolve({ error: "초안이 없어요." })
        }
      />
    </>
  );
}
