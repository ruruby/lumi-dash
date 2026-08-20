import { NextRequest, NextResponse } from "next/server";
import { analyzeTechProgress } from "@/lib/tech-progress";
import { isLocalClaudeCliAvailable } from "@/lib/local-claude-cli";
import { getSampleTechProgress, isSampleVaultPath } from "@/lib/sample-mode";

export async function GET() {
  return NextResponse.json({ available: await isLocalClaudeCliAvailable() });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const vaultPath: string = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";
  const folder: string = typeof body.folder === "string" ? body.folder : "";
  const demoMode = body.demoMode === true;

  if (!vaultPath) {
    return NextResponse.json({ error: "먼저 Obsidian vault를 연결해 주세요." }, { status: 400 });
  }

  if (demoMode && isSampleVaultPath(vaultPath)) {
    return NextResponse.json(getSampleTechProgress(folder));
  }

  if (!(await isLocalClaudeCliAvailable())) {
    return NextResponse.json(
      { error: "기술 동향 분석은 로컬 claude CLI 설정이 필요해요." },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json(await analyzeTechProgress(vaultPath, folder));
  } catch (error) {
    console.error("[/api/tech-progress]", error);
    return NextResponse.json({ error: "분석 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
