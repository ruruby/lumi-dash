"use client";

import { ACCENT_SOFT } from "@/lib/lumi-theme";

/**
 * Entry point on the category detail screen: says how much is waiting for this
 * topic and hands the user to the inbox, rather than dumping candidates into a
 * screen meant for settled knowledge.
 */
type InboxTeaserProps = {
  count: number;
  onReview: () => void;
};

export function InboxTeaser({ count, onReview }: InboxTeaserProps) {
  if (count <= 0) return null;

  return (
    <button
      onClick={onReview}
      style={{
        background: "linear-gradient(160deg, rgba(201,154,75,0.18), rgba(201,154,75,0.06))",
        border: "1px solid rgba(201,154,75,0.35)",
      }}
      className="flex w-full shrink-0 items-center justify-between gap-3 rounded-[14px] px-3.5 py-2.5 text-left"
    >
      <span style={{ fontSize: 11.5, color: "rgba(236,234,243,0.85)" }}>
        이 주제에서 검토할 새 자료 <strong style={{ color: ACCENT_SOFT }}>{count}건</strong>
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT_SOFT }} className="shrink-0">
        Review Sources →
      </span>
    </button>
  );
}
