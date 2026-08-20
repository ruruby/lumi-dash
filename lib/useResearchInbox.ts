"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSampleCandidates, getSampleCollectorStatus, getSampleNoteDraft, getSampleTopicProfile } from "@/lib/sample-mode";
import type {
  Candidate,
  CandidateStatus,
  CollectRunResult,
  TopicProfile,
  WikiNoteDraft,
} from "@/lib/research-types";
import type { TopicCollectorStatus } from "@/lib/research-store";

export type InboxState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; candidates: Candidate[]; profile: TopicProfile | null; handled: number; demo?: boolean };

type CollectState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "error"; message: string }
  | { status: "done"; result: CollectRunResult };

export type SaveOutcome = { relativePath: string; demo: boolean };

/**
 * Research Inbox state for one category.
 *
 * In sample mode nothing leaves the browser: candidates, drafts, and the
 * "saved" result are all local, so the flow is walkable without a vault, an
 * API, or a local `claude` CLI — and no file is ever written.
 */
export function useResearchInbox(
  topicKey: string | null,
  topicName: string | null,
  coreKeywords: string[],
  options: { demo?: boolean; vaultPath?: string } = {},
) {
  const demo = options.demo ?? false;
  const vaultPath = options.vaultPath ?? "";

  const [liveState, setLiveState] = useState<InboxState>({ status: "idle" });
  const [collectState, setCollectState] = useState<CollectState>({ status: "idle" });
  // Sample-mode actions are held here so the four buttons visibly do something.
  const [demoStatuses, setDemoStatuses] = useState<Record<string, CandidateStatus>>({});

  /** Sample mode is derived, never fetched, so it needs no request and no effect. */
  const demoState = useMemo<InboxState>(() => {
    if (topicKey === null) return { status: "idle" };
    const all = getSampleCandidates(topicKey).map((candidate) => ({
      ...candidate,
      status: demoStatuses[candidate.id] ?? candidate.status,
    }));
    const candidates = all.filter(
      (candidate) =>
        candidate.status === "new" || candidate.status === "important" || candidate.status === "readLater",
    );
    return {
      status: "ready",
      candidates,
      profile: getSampleTopicProfile(topicKey),
      handled: all.length - candidates.length,
      demo: true,
    };
  }, [topicKey, demoStatuses]);

  const reload = useCallback(async () => {
    if (demo || topicKey === null) return;

    setLiveState({ status: "loading" });
    try {
      const response = await fetch(`/api/research?topicKey=${encodeURIComponent(topicKey)}`);
      const data = await response.json();
      if (!response.ok) {
        setLiveState({ status: "error", message: data.error ?? "후보 자료를 읽지 못했어요." });
        return;
      }
      setLiveState({
        status: "ready",
        candidates: data.candidates ?? [],
        profile: data.profile ?? null,
        handled: data.handled ?? 0,
      });
    } catch {
      setLiveState({ status: "error", message: "네트워크 오류로 후보 자료를 읽지 못했어요." });
    }
  }, [topicKey, demo]);

  useEffect(() => {
    if (demo || topicKey === null) return;
    void reload();
  }, [reload, demo, topicKey]);

  const state = demo ? demoState : topicKey === null ? { status: "idle" as const } : liveState;

  const collect = useCallback(async () => {
    if (topicKey === null || !topicName) return;

    if (demo) {
      setCollectState({
        status: "done",
        result: {
          found: getSampleCandidates(topicKey).length,
          added: 0,
          duplicates: getSampleCandidates(topicKey).length,
          searchesUsed: 0,
          budgetExhausted: false,
          analysisSkipped: false,
          analysisCallsFailed: false,
          warnings: ["샘플 모드에서는 외부 요청을 보내지 않고 준비된 후보 자료를 보여줍니다."],
          finishedAt: Date.now(),
        },
      });
      return;
    }

    setCollectState({ status: "running" });
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "collect", topicKey, topicName, coreKeywords }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCollectState({ status: "error", message: data.error ?? "자료를 수집하지 못했어요." });
        return;
      }
      setCollectState({ status: "done", result: data.result });
      await reload();
    } catch {
      setCollectState({ status: "error", message: "네트워크 오류로 자료를 수집하지 못했어요." });
    }
  }, [topicKey, topicName, coreKeywords, demo, reload]);

  const act = useCallback(
    async (id: string, status: CandidateStatus) => {
      if (demo) {
        setDemoStatuses((current) => ({ ...current, [id]: status }));
        return;
      }

      try {
        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", id, status }),
        });
        if (response.ok) await reload();
      } catch {
        // Leave the list as-is; the user can retry.
      }
    },
    [demo, reload],
  );

  /** Builds the draft. Writes nothing — saving is a separate, confirmed step. */
  const requestDraft = useCallback(
    async (candidate: Candidate): Promise<WikiNoteDraft | { error: string }> => {
      if (demo) {
        return {
          candidateId: candidate.id,
          title: candidate.title,
          markdown: getSampleNoteDraft(candidate),
          aiGenerated: false,
        };
      }

      try {
        const response = await fetch("/api/research/note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: candidate.id,
            topicName,
            vaultPath,
            folder: topicKey ?? "",
          }),
        });
        const data = await response.json();
        if (!response.ok) return { error: data.error ?? "초안을 만들지 못했어요." };
        return data.draft as WikiNoteDraft;
      } catch {
        return { error: "네트워크 오류로 초안을 만들지 못했어요." };
      }
    },
    [demo, topicName, vaultPath, topicKey],
  );

  /** Saves a draft the user confirmed. The only call that reaches the vault. */
  const saveDraft = useCallback(
    async (draft: WikiNoteDraft, title: string, markdown: string): Promise<SaveOutcome | { error: string }> => {
      if (demo) {
        setDemoStatuses((current) => ({ ...current, [draft.candidateId]: "added" }));
        return { relativePath: `${topicKey ?? ""}/${title}.md`, demo: true };
      }

      if (!vaultPath) return { error: "먼저 vault 경로를 연결해주세요." };

      try {
        const response = await fetch("/api/research/note", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: draft.candidateId,
            vaultPath,
            folder: topicKey ?? "",
            title,
            markdown,
          }),
        });
        const data = await response.json();
        if (!response.ok) return { error: data.error ?? "노트를 저장하지 못했어요." };
        await reload();
        return { relativePath: data.note.relativePath, demo: false };
      } catch {
        return { error: "네트워크 오류로 노트를 저장하지 못했어요." };
      }
    },
    [demo, vaultPath, topicKey, reload],
  );

  const newCount = useMemo(
    () => (state.status === "ready" ? state.candidates.filter((c) => c.status === "new").length : 0),
    [state],
  );

  return { state, collectState, collect, act, requestDraft, saveDraft, reload, newCount };
}

/**
 * Unhandled candidate counts per topic, for the dock badge and the per-category
 * entry point. Sample mode counts its own fixed set.
 */
export function useInboxCounts(topicKeys: string[], demo = false): { counts: Record<string, number>; total: number } {
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  const keysSignature = topicKeys.join("|");

  const demoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const key of keysSignature ? keysSignature.split("|") : []) {
      counts[key] = getSampleCandidates(key).length;
    }
    return counts;
  }, [keysSignature]);

  useEffect(() => {
    if (demo) return;

    let cancelled = false;
    fetch("/api/research?mode=counts")
      .then(async (response) => {
        const data = await response.json();
        if (cancelled || !response.ok) return;
        setLiveCounts(data.counts ?? {});
      })
      .catch(() => {
        // A missing badge is better than a broken dock.
      });

    return () => {
      cancelled = true;
    };
  }, [demo]);

  const counts = demo ? demoCounts : liveCounts;
  const total = useMemo(() => Object.values(counts).reduce((sum, count) => sum + count, 0), [counts]);
  return { counts, total };
}

export type CollectorStatusState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; topics: TopicCollectorStatus[]; demo?: boolean };

/**
 * Per-topic collector activity for the profile view's summary card: when each
 * category last ran a collection and where its candidates currently stand.
 */
export function useCollectorStatus(demo: boolean): CollectorStatusState {
  const [liveState, setLiveState] = useState<CollectorStatusState>({ status: "loading" });

  useEffect(() => {
    if (demo) return;

    let cancelled = false;
    fetch("/api/research?mode=collectorStatus")
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setLiveState({ status: "error", message: data.error ?? "수집 현황을 읽지 못했어요." });
          return;
        }
        setLiveState({ status: "ready", topics: data.topics ?? [] });
      })
      .catch(() => {
        if (!cancelled) setLiveState({ status: "error", message: "네트워크 오류로 수집 현황을 읽지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [demo]);

  if (demo) return { status: "ready", topics: getSampleCollectorStatus(), demo: true };
  return liveState;
}
