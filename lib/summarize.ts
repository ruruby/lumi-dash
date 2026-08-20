import { getOpenAIClient } from "@/lib/openai-client";
import type { NewsItem } from "@/lib/news";

export async function summarizeNewsItem(item: NewsItem): Promise<string> {
  const client = getOpenAIClient();
  if (!client) return item.snippet;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `다음 뉴스 제목을 참고해서, 핵심 내용을 한국어 1~2문장으로 정리해줘. 설명 없이 정리한 문장만 출력해.\n\n제목: ${item.title}\n출처: ${item.source}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? item.snippet;
}
