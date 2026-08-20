import { NextRequest, NextResponse } from "next/server";
import { computeOverviewMetrics, generateOverviewNarrative, type OverviewCategoryInput } from "@/lib/overview";
import { isLocalClaudeCliAvailable } from "@/lib/local-claude-cli";
import { getSampleNarrative, isSampleVaultPath } from "@/lib/sample-mode";

function parseCategories(value: unknown): OverviewCategoryInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      name: typeof c.name === "string" ? c.name : "",
      folder: typeof c.folder === "string" ? c.folder : "",
      keywords: Array.isArray(c.keywords) ? c.keywords.filter((k): k is string => typeof k === "string") : [],
    }))
    .filter((c) => c.name);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const vaultPath: string = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";
  const categories = parseCategories(body.categories);
  const windowDays: number = Number.isFinite(body.windowDays) ? Math.max(1, Math.trunc(body.windowDays)) : 7;
  const withNarrative: boolean = body.withNarrative !== false;

  if (!vaultPath) {
    return NextResponse.json({ error: "먼저 Obsidian vault를 연결해주세요." }, { status: 400 });
  }
  if (categories.length === 0) {
    return NextResponse.json({ error: "먼저 카테고리를 하나 이상 만들어주세요." }, { status: 400 });
  }

  let metrics;
  let gathered;
  try {
    // Timestamps come from the request moment so the comparison windows are well-defined.
    const computed = await computeOverviewMetrics(vaultPath, categories, windowDays, Date.now());
    metrics = computed.metrics;
    gathered = computed.gathered;
  } catch (error) {
    console.error("[/api/overview] metrics", error);
    return NextResponse.json({ error: "자료를 모으는 중 문제가 발생했어요." }, { status: 502 });
  }

  if (!withNarrative) {
    return NextResponse.json({ metrics, narrative: null, demo: isSampleVaultPath(vaultPath) });
  }

  if (isSampleVaultPath(vaultPath)) {
    return NextResponse.json({ metrics, narrative: getSampleNarrative(metrics), demo: true });
  }

  if (!(await isLocalClaudeCliAvailable())) {
    return NextResponse.json({
      metrics,
      narrative: null,
      narrativeError: "AI 분석은 로컬에서 이 앱을 실행할 때만 사용할 수 있어요. (claude CLI가 감지되지 않았어요.)",
    });
  }

  try {
    const narrative = await generateOverviewNarrative(metrics, gathered);
    return NextResponse.json({ metrics, narrative });
  } catch (error) {
    console.error("[/api/overview] narrative", error);
    // Metrics are real and already computed — hand them back even when the AI pass fails.
    return NextResponse.json({
      metrics,
      narrative: null,
      narrativeError: "AI 분석 중 문제가 발생했어요. 수치는 그대로 표시됩니다.",
    });
  }
}
