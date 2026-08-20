"use client";

import { useEffect, useState } from "react";
import { MarkdownView } from "@/components/lumi/MarkdownView";
import { ACCENT, MANROPE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { WikiNoteDraft } from "@/lib/research-types";
import type { SaveOutcome } from "@/lib/useResearchInbox";

/**
 * The confirmation step of Add to Wiki. The draft is visible and editable here;
 * nothing reaches the vault until 저장 is pressed.
 */
type WikiDraftModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  draft: WikiNoteDraft | null;
  error: string | null;
  targetFolder: string;
  onSave: (title: string, markdown: string) => Promise<SaveOutcome | { error: string }>;
};

export function WikiDraftModal({
  open,
  onClose,
  loading,
  draft,
  error,
  targetFolder,
  onSave,
}: WikiDraftModalProps) {
  // Seeded from the draft. The parent remounts this with a per-draft `key`, so
  // a new draft gets fresh state instead of an effect syncing props into state.
  const [title, setTitle] = useState(draft?.title ?? "");
  const [markdown, setMarkdown] = useState(draft?.markdown ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveOutcome | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const result = await onSave(title.trim(), markdown);
    setSaving(false);
    if ("error" in result) {
      setSaveError(result.error);
      return;
    }
    setSaved(result);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: "rgba(4,6,16,0.72)", backdropFilter: "blur(6px)", fontFamily: MANROPE }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, rgba(45,54,92,0.92), rgba(16,20,38,0.96))",
          border: "1px solid rgba(201,154,75,0.3)",
          boxShadow: "0 24px 70px rgba(3,5,14,0.7)",
        }}
        className="flex w-full max-w-[760px] max-h-full flex-col rounded-[20px] p-6"
      >
        <div className="mb-3 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff" }}>Wiki 노트 초안</div>
            <div style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mt-0.5">
              확정하기 전에는 파일이 만들어지지 않아요 · 저장 위치 {targetFolder || "(vault 루트)"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: TEXT_MUTED }}
            className="shrink-0 rounded-lg px-2 py-1 text-[16px] leading-none hover:bg-white/5"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {loading && (
          <p className="py-8 text-center text-[12.5px]" style={{ color: TEXT_MUTED }}>
            원문에서 의미 있는 내용을 뽑아 초안을 만드는 중...
          </p>
        )}

        {error && (
          <p className="py-6 text-[12.5px]" style={{ color: "#e6a3a3" }}>
            {error}
          </p>
        )}

        {saved && (
          <div
            style={{ background: "rgba(95,168,118,0.14)", border: "1px solid rgba(95,168,118,0.4)" }}
            className="mb-3 shrink-0 rounded-xl px-3 py-2.5"
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8fd3a6" }}>
              {saved.demo ? "샘플 모드 — 실제 파일은 만들지 않았어요" : "노트를 저장했어요"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(236,234,243,0.7)" }} className="mt-0.5">
              {saved.relativePath}
            </div>
          </div>
        )}

        {draft && !loading && (
          <>
            {!draft.aiGenerated && (
              <div
                style={{ background: "rgba(201,154,75,0.12)", border: "1px solid rgba(201,154,75,0.32)" }}
                className="mb-3 shrink-0 rounded-xl px-3 py-2 text-[11px]"
                >
                <span style={{ color: "#f0d6a0", fontWeight: 700 }}>AI 분석 없음 · </span>
                <span style={{ color: "rgba(236,234,243,0.7)" }}>
                  출처 정보만 채운 초안이에요. 요약은 원문을 확인한 뒤 직접 채워주세요.
                </span>
              </div>
            )}

            <div className="mb-3 shrink-0">
              <label style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mb-1 block">
                노트 제목 (파일 이름이 됩니다)
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={Boolean(saved)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#eceaf3",
                }}
                className="w-full rounded-[10px] px-3 py-2 text-[12.5px] outline-none disabled:opacity-60"
              />
            </div>

            <div className="mb-2 flex items-center justify-between shrink-0">
              <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>
                {editing ? "마크다운 직접 편집" : "저장될 내용 미리보기"}
              </span>
              {!saved && (
                <button
                  onClick={() => setEditing((current) => !current)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "rgba(236,234,243,0.75)",
                  }}
                  className="rounded-lg px-2.5 py-1 text-[10.5px] font-semibold"
                >
                  {editing ? "미리보기" : "직접 고치기"}
                </button>
              )}
            </div>

            <div
              style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.08)" }}
              className="lumi-scroll mb-4 min-h-0 flex-1 overflow-y-auto rounded-xl p-4"
            >
              {editing ? (
                <textarea
                  value={markdown}
                  onChange={(event) => setMarkdown(event.target.value)}
                  spellCheck={false}
                  style={{ color: "rgba(236,234,243,0.85)", fontFamily: "ui-monospace, monospace" }}
                  className="h-full min-h-[280px] w-full resize-none bg-transparent text-[11.5px] leading-relaxed outline-none"
                />
              ) : (
                <MarkdownView markdown={markdown} className="min-w-0 break-words" />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 shrink-0">
              <span style={{ fontSize: 10.5, color: "#e6a3a3" }}>{saveError}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "rgba(236,234,243,0.75)",
                  }}
                  className="rounded-[10px] px-3.5 py-2 text-[11.5px] font-semibold"
                >
                  {saved ? "닫기" : "취소"}
                </button>
                {!saved && (
                  <button
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    style={{
                      background: `linear-gradient(160deg, ${ACCENT}, rgba(201,154,75,0.65))`,
                      color: "#1a1206",
                      opacity: saving || !title.trim() ? 0.55 : 1,
                    }}
                    className="rounded-[10px] px-4 py-2 text-[11.5px] font-bold"
                  >
                    {saving ? "저장 중..." : "이 내용으로 저장"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
