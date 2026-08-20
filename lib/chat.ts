import { runClaudeCli } from "@/lib/local-claude-cli";
import { readVault, buildVaultContext } from "@/lib/vault";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatNewsContext = {
  title: string;
  summary: string;
  link: string;
};

export type ChatSource = "wiki" | "news";

function buildNewsSystemPrompt(categoryName: string, newsContext: ChatNewsContext[]): string {
  const contextBlock = newsContext
    .map((item, index) => `${index + 1}. ${item.title} — ${item.summary} (출처: ${item.link})`)
    .join("\n");

  return `너는 "${categoryName}" 카테고리를 담당하는 LUMI라는 어시스턴트야. 아래 수집된 뉴스만 근거로 한국어로 답해. 뉴스에 없는 내용을 물어보면 모른다고 솔직히 답해. 도구를 쓰지 말고 텍스트로만 답해.\n\n[수집된 뉴스]\n${contextBlock}`;
}

function buildWikiSystemPrompt(vaultContext: string): string {
  return `너는 사용자의 개인 위키(Obsidian vault)를 근거로 답하는 LUMI라는 어시스턴트야. 아래는 사용자가 직접 정리해 둔 노트들이야.

사용자의 노트에 적힌 내용만 근거로 한국어로 답해. 노트에 없는 내용을 물어보면 "그 내용은 노트에 없어요"라고 솔직히 답하고, 일반 상식으로 지어내지 마. 답할 때는 어느 노트에 근거했는지 노트 제목을 함께 밝혀. 도구를 쓰지 말고 텍스트로만 답해.

[사용자의 노트]
${vaultContext}`;
}

function buildPrompt(history: ChatMessage[]): string {
  const latest = history[history.length - 1]?.content ?? "";
  if (history.length <= 1) return latest;

  const previous = history
    .slice(0, -1)
    .map((message) => `${message.role === "user" ? "사용자" : "LUMI"}: ${message.content}`)
    .join("\n");

  return `[이전 대화]\n${previous}\n\n[새 질문]\n${latest}`;
}

export async function generateNewsChatReply(
  categoryName: string,
  newsContext: ChatNewsContext[],
  history: ChatMessage[],
): Promise<string> {
  const reply = await runClaudeCli(buildPrompt(history), buildNewsSystemPrompt(categoryName, newsContext));
  return reply || "답변을 생성하지 못했어요.";
}

export async function generateWikiChatReply(
  vaultPath: string,
  folder: string,
  history: ChatMessage[],
): Promise<string> {
  const { notes } = await readVault(vaultPath, folder);
  if (notes.length === 0) {
    throw new Error("vault에서 노트를 찾지 못했어요.");
  }

  const reply = await runClaudeCli(buildPrompt(history), buildWikiSystemPrompt(buildVaultContext(notes)));
  return reply || "답변을 생성하지 못했어요.";
}
