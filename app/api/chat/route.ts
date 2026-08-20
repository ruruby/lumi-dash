import { NextRequest, NextResponse } from "next/server";
import {
  generateNewsChatReply,
  generateWikiChatReply,
  type ChatMessage,
  type ChatNewsContext,
} from "@/lib/chat";
import { isLocalClaudeCliAvailable } from "@/lib/local-claude-cli";

export async function GET() {
  return NextResponse.json({ available: await isLocalClaudeCliAvailable() });
}

export async function POST(request: NextRequest) {
  if (!(await isLocalClaudeCliAvailable())) {
    return NextResponse.json(
      { error: "LUMI 채팅은 로컬에서 이 앱을 실행할 때만 사용할 수 있어요. (claude CLI가 감지되지 않았어요.)" },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const source: string = body.source === "news" ? "news" : "wiki";
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

  if (history.length === 0) {
    return NextResponse.json({ error: "질문 내용이 비어 있어요." }, { status: 400 });
  }

  try {
    if (source === "news") {
      const categoryName: string = typeof body.categoryName === "string" ? body.categoryName : "";
      const newsContext: ChatNewsContext[] = Array.isArray(body.newsContext) ? body.newsContext : [];

      if (!categoryName || newsContext.length === 0) {
        return NextResponse.json(
          { error: "뉴스 기반으로 답하려면 먼저 카테고리를 선택하고 뉴스를 모아주세요." },
          { status: 400 },
        );
      }

      const reply = await generateNewsChatReply(categoryName, newsContext, history);
      return NextResponse.json({ reply });
    }

    const vaultPath: string = typeof body.vaultPath === "string" ? body.vaultPath.trim() : "";
    const folder: string = typeof body.folder === "string" ? body.folder : "";
    if (!vaultPath) {
      return NextResponse.json(
        { error: "위키 기반으로 답하려면 먼저 Obsidian vault를 연결해주세요." },
        { status: 400 },
      );
    }

    const reply = await generateWikiChatReply(vaultPath, folder, history);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json(
      { error: "답변을 가져오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
