import { NextRequest, NextResponse } from "next/server";
import { fetchNewsForKeywords } from "@/lib/news";
import { summarizeNewsItem } from "@/lib/summarize";

export async function GET(request: NextRequest) {
  const keywordsParam = request.nextUrl.searchParams.get("keywords") ?? "";
  const keywords = keywordsParam
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (keywords.length === 0) {
    return NextResponse.json(
      { error: "카테고리에 키워드를 하나 이상 추가해주세요." },
      { status: 400 },
    );
  }

  let items;
  try {
    items = await fetchNewsForKeywords(keywords);
  } catch {
    return NextResponse.json(
      { error: "뉴스를 가져오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const summary = await summarizeNewsItem(item);
        return { ...item, summary };
      } catch {
        return { ...item, summary: item.snippet };
      }
    }),
  );

  return NextResponse.json({ items: results });
}
