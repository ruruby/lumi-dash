import { NextRequest, NextResponse } from "next/server";
import { runCollection } from "@/lib/research-collector";
import {
  getCollectionSummary,
  getCollectorStatus,
  getTopicProfile,
  listCandidates,
  removeProfileEntry,
  setCandidateStatus,
} from "@/lib/research-store";
import { INBOX_STATUSES, type CandidateStatus } from "@/lib/research-types";

const VALID_STATUSES: CandidateStatus[] = ["new", "important", "readLater", "added", "ignored"];

/**
 * Research Inbox reads and actions. Collection runs here too, because it is the
 * only place that writes candidates. Nothing in this route touches the vault —
 * that is isolated in `/api/research/note`.
 */
export async function GET(request: NextRequest) {
  const topicKey = request.nextUrl.searchParams.get("topicKey");
  const mode = request.nextUrl.searchParams.get("mode");

  try {
    if (mode === "counts") {
      // Badge counts for every topic at once, so the dock does not need one call per category.
      const all = await listCandidates();
      const counts: Record<string, number> = {};
      for (const candidate of all) {
        if (candidate.status !== "new") continue;
        counts[candidate.topicKey] = (counts[candidate.topicKey] ?? 0) + 1;
      }
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      return NextResponse.json({ counts, total });
    }

    if (mode === "collectorStatus") {
      const topics = await getCollectorStatus();
      return NextResponse.json({ topics });
    }

    if (mode === "collectionSummary") {
      const summary = await getCollectionSummary();
      return NextResponse.json({ summary });
    }

    const candidates = await listCandidates(topicKey ?? undefined);
    const profile = topicKey === null ? null : await getTopicProfile(topicKey);
    return NextResponse.json({
      candidates: candidates.filter((candidate) => INBOX_STATUSES.includes(candidate.status)),
      handled: candidates.filter((candidate) => !INBOX_STATUSES.includes(candidate.status)).length,
      profile,
    });
  } catch (error) {
    console.error("[/api/research GET]", error);
    return NextResponse.json({ error: "후보 자료를 읽는 중 문제가 발생했어요." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const action = String(body.action ?? "");

  try {
    if (action === "collect") {
      const topicKey = typeof body.topicKey === "string" ? body.topicKey : null;
      const topicName = typeof body.topicName === "string" ? body.topicName.trim() : "";
      const coreKeywords = Array.isArray(body.coreKeywords)
        ? body.coreKeywords.filter((keyword): keyword is string => typeof keyword === "string")
        : [];

      if (topicKey === null || !topicName) {
        return NextResponse.json({ error: "카테고리를 먼저 선택해주세요." }, { status: 400 });
      }
      if (coreKeywords.length === 0) {
        return NextResponse.json(
          { error: "이 카테고리에 키워드를 하나 이상 추가하면 자료를 찾아드려요." },
          { status: 400 },
        );
      }

      const result = await runCollection({ topicKey, topicName, coreKeywords });
      return NextResponse.json({ result });
    }

    if (action === "status") {
      const id = typeof body.id === "string" ? body.id : "";
      const status = String(body.status ?? "") as CandidateStatus;
      if (!id || !VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "처리할 자료와 동작을 확인해주세요." }, { status: 400 });
      }

      const candidate = await setCandidateStatus(id, status);
      if (!candidate) {
        return NextResponse.json({ error: "그 자료를 찾을 수 없어요." }, { status: 404 });
      }
      return NextResponse.json({ candidate });
    }

    if (action === "removeProfileEntry") {
      const topicKey = typeof body.topicKey === "string" ? body.topicKey : null;
      const field = String(body.field ?? "");
      const value = typeof body.value === "string" ? body.value : "";
      const allowed = ["expandedKeywords", "importantAuthors", "importantOrganizations", "excludedTopics"];
      if (topicKey === null || !allowed.includes(field) || !value) {
        return NextResponse.json({ error: "지울 항목을 확인해주세요." }, { status: 400 });
      }

      const profile = await removeProfileEntry(topicKey, field as never, value);
      return NextResponse.json({ profile });
    }

    return NextResponse.json({ error: "알 수 없는 요청이에요." }, { status: 400 });
  } catch (error) {
    console.error("[/api/research POST]", error);
    return NextResponse.json({ error: "요청을 처리하는 중 문제가 발생했어요." }, { status: 500 });
  }
}
