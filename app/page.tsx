"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/lumi/TopBar";
import { CategoryKeywordManager } from "@/components/lumi/CategoryKeywordManager";
import { NewsPanel } from "@/components/lumi/NewsPanel";
import { ResearchGraphPanel } from "@/components/lumi/ResearchGraphPanel";
import { TechProgressPanel } from "@/components/lumi/TechProgressPanel";
import { ResearchRadarPanel } from "@/components/lumi/ResearchRadarPanel";
import { TrendPanoramaPanel } from "@/components/lumi/TrendPanoramaPanel";
import { WhatChangedPanel } from "@/components/lumi/WhatChangedPanel";
import { SecurityIssuesPanel } from "@/components/lumi/SecurityIssuesPanel";
import { LumiInsightsPanel } from "@/components/lumi/LumiInsightsPanel";
import { ContinueResearchPanel } from "@/components/lumi/ContinueResearchPanel";
import { KnowledgeBrowser } from "@/components/lumi/KnowledgeBrowser";
import { LumiCard } from "@/components/lumi/LumiCard";
import { ChatModal } from "@/components/lumi/ChatModal";
import { AmbientBackground } from "@/components/lumi/AmbientBackground";
import { BottomDock, type DockView } from "@/components/lumi/BottomDock";
import { useCategoryNews } from "@/lib/useCategoryNews";
import { useVaultRoot, useVaultNotes } from "@/lib/useVault";
import { useCategories } from "@/lib/useCategories";
import { useOverview } from "@/lib/useOverview";
import { useVisitLog } from "@/lib/useVisitLog";
import { MANROPE, PAGE_BACKGROUND, TEXT } from "@/lib/lumi-theme";
import { isSampleVaultPath } from "@/lib/sample-mode";
import { VaultContributionPanel } from "@/components/lumi/VaultContributionPanel";

const EMPTY_KEYWORDS: string[] = [];

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [windowDays, setWindowDays] = useState(7);
  const [dockView, setDockView] = useState<DockView>("panorama");

  const {
    categories,
    selected,
    select,
    selectByFolder,
    addCategory,
    removeCategory,
    addKeyword,
    removeKeyword,
  } = useCategories();

  const { vaultPath, setVaultPath, folders, rootError } = useVaultRoot();
  const sampleMode = isSampleVaultPath(vaultPath);
  const vaultConnected = Boolean(vaultPath) && !rootError;

  const keywords = selected?.keywords ?? EMPTY_KEYWORDS;
  const newsState = useCategoryNews(keywords, sampleMode);
  const newsItems = newsState.status === "success" ? newsState.items : [];

  const vaultFolder = selected?.folder ?? "";
  const vaultState = useVaultNotes(vaultPath, selected ? vaultFolder : null);
  const vaultNoteCount = vaultState.status === "ready" ? vaultState.notes.length : 0;

  const overviewCategories = useMemo(
    () => categories.map((c) => ({ name: c.name, folder: c.folder, keywords: c.keywords })),
    [categories],
  );
  const overview = useOverview(vaultPath, overviewCategories, windowDays);
  const { visits, recordVisit } = useVisitLog();

  // Remember when each topic was opened, and how many notes it had then,
  // so Continue Research can show a real "new since last visit" delta.
  useEffect(() => {
    if (selected && vaultState.status === "ready") {
      recordVisit(selected.folder, vaultState.notes.length);
    }
  }, [selected, vaultState, recordVisit]);

  const metrics = overview.metrics;
  const narrative = overview.narrative;
  const canRunNarrative = Boolean(vaultPath) && categories.length > 0;

  return (
    <div
      style={{ fontFamily: MANROPE, background: PAGE_BACKGROUND, color: TEXT }}
      className="relative flex flex-1 flex-col h-full min-h-0 overflow-hidden"
    >
      <AmbientBackground />
      <div className="relative z-10 flex flex-1 min-h-0 flex-col min-w-0">
        <TopBar demoMode={sampleMode} />

        {/* The page never scrolls. Each card is fixed to the column height and
            scrolls its own content instead. */}
        <main className="flex-1 min-h-0 overflow-hidden px-8 py-8 pb-24">
          {selected ? (
            /* ---- Detail: one technology in depth ---- */
            <div className="grid gap-5 h-full min-h-0 grid-cols-1 md:grid-cols-[270px_1fr_300px]">
              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <LumiCard onOpenChat={() => setChatOpen(true)} />
                <CategoryKeywordManager
                  categories={categories}
                  selected={selected}
                  onSelect={select}
                  onAddCategory={addCategory}
                  onRemoveCategory={removeCategory}
                  onAddKeyword={addKeyword}
                  onRemoveKeyword={removeKeyword}
                  vaultConnected={vaultConnected}
                  vaultFolders={folders}
                  onOpenKnowledgeDB={() => setDockView("knowledge")}
                />
              </div>

              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <ResearchGraphPanel state={vaultState} vaultPath={vaultPath} folder={vaultFolder} />
                <TechProgressPanel
                  key={`${vaultPath}::${vaultFolder}`}
                  vaultPath={vaultPath}
                  folder={vaultFolder}
                  vaultReady={vaultState.status === "ready" && vaultNoteCount > 0}
                />
              </div>

              <div className="flex flex-col min-w-0 h-full min-h-0">
                <NewsPanel
                  categoryName={selected.name}
                  hasKeywords={keywords.length > 0}
                  state={newsState}
                />
              </div>
            </div>
          ) : dockView === "knowledge" ? (
            /* ---- Knowledge: browse the vault's raw files directly ---- */
            <KnowledgeBrowser vaultPath={vaultPath} onChangeVaultPath={setVaultPath} vaultRootError={rootError} />
          ) : dockView === "profile" ? (
            <VaultContributionPanel vaultPath={vaultPath} />
          ) : dockView === "trends" ? (
            /* ---- Trends: the time-and-activity view behind the dock's trend icon ---- */
            <div className="grid gap-5 h-full min-h-0 grid-cols-1 md:grid-cols-[270px_1fr]">
              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <LumiCard onOpenChat={() => setChatOpen(true)} />
                <CategoryKeywordManager
                  categories={categories}
                  selected={null}
                  onSelect={select}
                  onAddCategory={addCategory}
                  onRemoveCategory={removeCategory}
                  onAddKeyword={addKeyword}
                  onRemoveKeyword={removeKeyword}
                  vaultConnected={vaultConnected}
                  vaultFolders={folders}
                  onOpenKnowledgeDB={() => setDockView("knowledge")}
                />
              </div>

              {/* Radar takes the upper two thirds; the two smaller cards share the row below. */}
              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <div className="flex flex-[2] min-h-0 flex-col">
                  <ResearchRadarPanel
                    topics={metrics?.topics ?? []}
                    explanations={narrative?.radar ?? []}
                    windowDays={windowDays}
                    onSelectTopic={selectByFolder}
                  />
                </div>

                <div className="grid flex-1 min-h-0 grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col min-w-0 min-h-0">
                    <WhatChangedPanel
                      topics={metrics?.topics ?? []}
                      summaries={narrative?.whatChanged ?? []}
                      windowDays={windowDays}
                      onChangeWindow={setWindowDays}
                    />
                  </div>
                  <div className="flex flex-col min-w-0 min-h-0">
                    <ContinueResearchPanel
                      topics={metrics?.topics ?? []}
                      visits={visits}
                      onSelectTopic={selectByFolder}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ---- Panorama: what matters now, no knowledge graph ---- */
            <div className="grid gap-5 h-full min-h-0 grid-cols-1 md:grid-cols-[270px_1fr_300px]">
              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <LumiCard onOpenChat={() => setChatOpen(true)} />
                <CategoryKeywordManager
                  categories={categories}
                  selected={null}
                  onSelect={select}
                  onAddCategory={addCategory}
                  onRemoveCategory={removeCategory}
                  onAddKeyword={addKeyword}
                  onRemoveKeyword={removeKeyword}
                  vaultConnected={vaultConnected}
                  vaultFolders={folders}
                  onOpenKnowledgeDB={() => setDockView("knowledge")}
                />
              </div>

              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <ResearchRadarPanel
                  variant="strip"
                  topics={metrics?.topics ?? []}
                  explanations={narrative?.radar ?? []}
                  windowDays={windowDays}
                  onSelectTopic={selectByFolder}
                  onOpenFull={() => setDockView("trends")}
                />
                <TrendPanoramaPanel topicMap={metrics?.topicMap ?? []} onSelectTopic={selectByFolder} />
              </div>

              <div className="flex flex-col gap-5 min-w-0 h-full min-h-0">
                <LumiInsightsPanel
                  insights={narrative?.insights ?? null}
                  loading={overview.loadingNarrative}
                  error={overview.narrativeError ?? overview.error}
                  canRun={canRunNarrative}
                  onRun={overview.runNarrative}
                />
                <SecurityIssuesPanel
                  issues={narrative?.securityIssues ?? []}
                  analyzed={Boolean(narrative)}
                  newsCount={metrics?.securityNewsCount ?? 0}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        categoryName={selected?.name ?? null}
        newsItems={newsItems}
        vaultPath={vaultPath}
        vaultFolder={vaultFolder}
        vaultNoteCount={vaultNoteCount}
      />
      <BottomDock
        activeView={dockView}
        onNavigate={(view) => {
          setDockView(view);
          // Both dock destinations are cross-category views, so leave the detail screen.
          select(null);
        }}
      />
    </div>
  );
}
