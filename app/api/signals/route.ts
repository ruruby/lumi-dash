import { NextRequest, NextResponse } from "next/server";
import { buildSignalFeed } from "@/lib/signal-feed";

export async function GET(request: NextRequest) {
  const keywordsParam = request.nextUrl.searchParams.get("keywords") ?? "";
  const keywords = keywordsParam
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  try {
    const feed = await buildSignalFeed(keywords);
    return NextResponse.json({ feed });
  } catch (error) {
    console.error("[/api/signals]", error);
    return NextResponse.json({ error: "신호를 모으는 중 문제가 발생했어요." }, { status: 500 });
  }
}
