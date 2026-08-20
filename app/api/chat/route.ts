import { NextRequest, NextResponse } from "next/server";
import {
  generateNewsChatReply,
  generateWikiChatReply,
  type ChatMessage,
  type ChatNewsContext,
} from "@/lib/chat";
import { isLocalClaudeCliAvailable } from "@/lib/local-claude-cli";
import { getSampleChatReply, isSampleVaultPath } from "@/lib/sample-mode";

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

  const source: "wiki" | "news" = body.source === "news" ? "news" : "wiki";
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
  const vaultPath: string = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";

  if (history.length === 0) {
    return NextResponse.json({ error: "질문 내용이 비어 있어요." }, { status: 400 });
  }

  if (isSampleVaultPath(vaultPath)) {
    return NextResponse.json({
      reply: getSampleChatReply(source, history[history.length - 1]?.content ?? ""),
      demo: true,
    });
  }

  if (!(await isLocalClaudeCliAvailable())) {
    return NextResponse.json({ error: "LUMI 채팅은 로컬 claude CLI 설정이 필요해요." }, { status: 503 });
  }

  try {
    if (source === "news") {
      const categoryName: string = typeof body.categoryName === "string" ? body.categoryName : "";
      const newsContext: ChatNewsContext[] = Array.isArray(body.newsContext) ? body.newsContext : [];
      if (!categoryName || newsContext.length === 0) {
        return NextResponse.json({ error: "카테고리를 선택하고 뉴스를 먼저 모아 주세요." }, { status: 400 });
      }
      return NextResponse.json({ reply: await generateNewsChatReply(categoryName, newsContext, history) });
    }

    const folder: string = typeof body.folder === "string" ? body.folder : "";
    if (!vaultPath) {
      return NextResponse.json({ error: "먼저 Obsidian vault를 연결해 주세요." }, { status: 400 });
    }
    return NextResponse.json({ reply: await generateWikiChatReply(vaultPath, folder, history) });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json({ error: "응답을 가져오는 중 문제가 발생했어요." }, { status: 502 });
  }
}
