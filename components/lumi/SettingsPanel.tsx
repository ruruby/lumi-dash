"use client";

import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ACCENT, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import { TRUSTED_SOURCES } from "@/lib/collectors/trusted-sources-config";

/**
 * 환경설정. One wide card, sections separated by rules, scrolling as more
 * settings are added — rather than one narrow card per setting with unused
 * space on either side.
 *
 * Sample mode is switched here rather than in the top bar, so the top bar
 * only ever states the current mode.
 */
type SettingsPanelProps = {
  vaultPath: string;
  sampleAvailable: boolean;
  sampleEnabled: boolean;
  onToggleSample: () => void;
  onOpenKnowledgeDB: () => void;
};

function SectionDivider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} className="my-5 shrink-0" />;
}

export function SettingsPanel({
  vaultPath,
  sampleAvailable,
  sampleEnabled,
  onToggleSample,
  onOpenKnowledgeDB,
}: SettingsPanelProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <GlassPanel className="w-full flex-1" fill hoverable cornerColor="#c99a4b">
        {/* 샘플 모드 */}
        <section>
          <div className="mb-1 flex items-center justify-between shrink-0">
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>샘플 모드</div>
            <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>
              {sampleAvailable ? (sampleEnabled ? "켜짐" : "꺼짐") : "사용할 수 없음"}
            </span>
          </div>

          <p className="mb-3 text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>
            내장 샘플 Vault를 쓸 때 뉴스, AI 분석, LUMI 채팅, Research Inbox를 데모 데이터로 체험합니다. 외부
            요청을 보내지 않고, Vault에 파일도 쓰지 않습니다.
          </p>

          {sampleAvailable ? (
            <button
              onClick={onToggleSample}
              aria-pressed={sampleEnabled}
              style={{
                background: sampleEnabled
                  ? `linear-gradient(160deg, ${ACCENT}, rgba(201,154,75,0.65))`
                  : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,154,75,0.4)",
                color: sampleEnabled ? "#1a1206" : "rgba(236,234,243,0.75)",
              }}
              className="w-fit rounded-[10px] px-4 py-2 text-[11.5px] font-bold"
            >
              {sampleEnabled ? "샘플 모드 끄기" : "샘플 모드 켜기"}
            </button>
          ) : (
            <div>
              <p className="mb-2 text-[11.5px]" style={{ color: TEXT_FAINT }}>
                현재 Vault 경로: {vaultPath || "(연결되지 않음)"}
              </p>
              <p className="mb-2 text-[11.5px]" style={{ color: TEXT_FAINT }}>
                샘플 모드는 Vault 경로가 <code style={{ color: "#e8d8b0" }}>sample_vault</code>일 때만 켤 수
                있어요.
              </p>
              <button
                onClick={onOpenKnowledgeDB}
                style={{
                  background: "rgba(122,142,196,0.24)",
                  border: "1px solid rgba(122,142,196,0.4)",
                  color: "#a9bce4",
                }}
                className="w-fit rounded-[10px] px-3.5 py-2 text-[11.5px] font-bold"
              >
                지식 DB에서 Vault 경로 바꾸기
              </button>
            </div>
          )}
        </section>

        <SectionDivider />

        {/* 수집 대상 Source */}
        <section>
          <div className="mb-1 flex items-center justify-between shrink-0">
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>수집 대상 Source</div>
            <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>Phase 1</span>
          </div>

          <p className="mb-3 text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>
            공식 API와 피드에서만 수집합니다. 웹 검색은 쓰지 않습니다.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }} className="mb-1.5">
                논문
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(236,234,243,0.75)" }}>
                OpenAlex · API 키 없이 동작 (무료 한도: 창당 검색 약 100회)
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }} className="mb-1.5">
                신뢰 기관 공식 피드
              </div>
              <div className="flex flex-col gap-1.5">
                {TRUSTED_SOURCES.map((source) => (
                  <div key={source.id} className="flex flex-col">
                    <span style={{ fontSize: 11.5, color: "rgba(236,234,243,0.8)", fontWeight: 600 }}>
                      {source.organization}
                    </span>
                    <span style={{ fontSize: 10, color: TEXT_FAINT }} className="truncate">
                      {source.feedUrl}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: TEXT_FAINT }}>
            자동 주기 수집은 아직 없습니다. Research Inbox에서 &ldquo;자료 수집&rdquo;을 누를 때만 실행됩니다.
          </p>
        </section>
      </GlassPanel>
    </div>
  );
}
