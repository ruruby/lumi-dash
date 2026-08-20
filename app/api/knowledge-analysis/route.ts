import { NextRequest, NextResponse } from "next/server";
import { analyzeKnowledge } from "@/lib/knowledge-analysis";
import { isLocalClaudeCliAvailable } from "@/lib/local-claude-cli";

export async function POST(request: NextRequest) {
  if (!(await isLocalClaudeCliAvailable())) {
    return NextResponse.json(
      { error: "Knowledge 분석은 로컬에서 이 앱을 실행할 때만 사용할 수 있어요. (claude CLI가 감지되지 않았어요.)" },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const vaultPath: string = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";
  const folder: string = typeof body.folder === "string" ? body.folder : "";

  if (!vaultPath) {
    return NextResponse.json({ error: "먼저 Obsidian vault를 연결해주세요." }, { status: 400 });
  }

  try {
    const analysis = await analyzeKnowledge(vaultPath, folder);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[/api/knowledge-analysis]", error);
    return NextResponse.json(
      { error: "분석 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
