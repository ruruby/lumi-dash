"use client";

import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { Candidate, ProfileEntry, TopicProfile } from "@/lib/research-types";

/**
 * What this category is currently searching with. Core keywords stay on the
 * category itself; everything here accumulates from collection and user
 * actions. AI-added entries are labelled and removable, so the profile never
 * drifts out of the user's control.
 */
type TopicProfilePanelProps = {
  categoryName: string | null;
  coreKeywords: string[];
  profile: TopicProfile | null;
  candidates: Candidate[];
  demo?: boolean;
  onRemoveEntry?: (
    field: "expandedKeywords" | "importantAuthors" | "importantOrganizations" | "excludedTopics",
    value: string,
  ) => void;
};

function Section({
  label,
  entries,
  field,
  onRemoveEntry,
}: {
  label: string;
  entries: ProfileEntry[];
  field: "expandedKeywords" | "importantAuthors" | "importantOrganizations" | "excludedTopics";
  onRemoveEntry?: TopicProfilePanelProps["onRemoveEntry"];
}) {
  return (
    <div className="mb-3">
      <div style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }} className="mb-1.5">
        {label}
      </div>
      {entries.length === 0 ? (
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>아직 없어요</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {entries.map((entry) => (
            <span
              key={entry.value}
              style={{
                background: entry.origin === "ai" ? "rgba(201,154,75,0.12)" : "rgba(255,255,255,0.06)",
                border:
                  entry.origin === "ai"
                    ? "1px dashed rgba(201,154,75,0.45)"
                    : "1px solid rgba(255,255,255,0.14)",
                color: entry.origin === "ai" ? "#f0d6a0" : "rgba(236,234,243,0.75)",
              }}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px]"
            >
              {entry.origin === "ai" && <span style={{ fontSize: 8.5, opacity: 0.8 }}>AI</span>}
              {entry.value}
              {onRemoveEntry && (
                <button
                  onClick={() => onRemoveEntry(field, entry.value)}
                  style={{ color: "inherit", opacity: 0.6 }}
                  className="ml-0.5 leading-none hover:opacity-100"
                  aria-label={`${entry.value} 지우기`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopicProfilePanel({
  categoryName,
  coreKeywords,
  profile,
  candidates,
  demo,
  onRemoveEntry,
}: TopicProfilePanelProps) {
  const seedPapers = profile
    ? candidates.filter((candidate) => profile.seedPaperIds.includes(candidate.id))
    : [];

  return (
    <GlassPanel className="w-full" hoverable cornerColor="#7a8ec4">
      <div className="mb-2 flex items-center justify-between shrink-0">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Topic Profile</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>{demo ? "데모 데이터" : "탐색 조건"}</span>
      </div>

      {!categoryName ? (
        <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리를 선택하면 그 주제의 탐색 조건을 보여드려요.
        </p>
      ) : (
        <>
          <div className="mb-3">
            <div style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }} className="mb-1.5">
              Core Keywords (내가 관리)
            </div>
            {coreKeywords.length === 0 ? (
              <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>왼쪽에서 키워드를 추가해주세요</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {coreKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    style={{
                      background: "rgba(201,154,75,0.2)",
                      border: "1px solid rgba(201,154,75,0.45)",
                      color: "#f0d6a0",
                    }}
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Section
            label="Expanded Keywords"
            entries={profile?.expandedKeywords ?? []}
            field="expandedKeywords"
            onRemoveEntry={onRemoveEntry}
          />
          <Section
            label="Important Authors"
            entries={profile?.importantAuthors ?? []}
            field="importantAuthors"
            onRemoveEntry={onRemoveEntry}
          />
          <Section
            label="Important Organizations"
            entries={profile?.importantOrganizations ?? []}
            field="importantOrganizations"
            onRemoveEntry={onRemoveEntry}
          />

          <div className="mb-3">
            <div style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }} className="mb-1.5">
              Seed Papers (Important 표시한 논문)
            </div>
            {seedPapers.length === 0 ? (
              <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>
                후보 자료를 Important로 표시하면 여기에 쌓여요
              </span>
            ) : (
              <div className="flex flex-col gap-1">
                {seedPapers.map((paper) => (
                  <span
                    key={paper.id}
                    style={{ color: "rgba(236,234,243,0.75)" }}
                    className="truncate text-[11px]"
                  >
                    · {paper.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Section
            label="Excluded Topics"
            entries={profile?.excludedTopics ?? []}
            field="excludedTopics"
            onRemoveEntry={onRemoveEntry}
          />
        </>
      )}
    </GlassPanel>
  );
}
