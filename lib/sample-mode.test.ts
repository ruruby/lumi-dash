import { describe, expect, test } from "vitest";
import {
  getSampleChatReply,
  getSampleNews,
  getSampleTechProgress,
  isSampleVaultPath,
} from "@/lib/sample-mode";

describe("sample mode", () => {
  test("저장소 상대 경로와 절대 경로의 sample_vault를 인식한다", () => {
    expect(isSampleVaultPath("sample_vault")).toBe(true);
    expect(isSampleVaultPath("C:\\workspace\\lumi\\sample_vault\\")).toBe(true);
    expect(isSampleVaultPath("C:\\notes\\my-vault")).toBe(false);
  });

  test("외부 연결 없이 데모 뉴스와 기술 동향을 제공한다", () => {
    const news = getSampleNews(["LLM developer tools"]);
    const progress = getSampleTechProgress("LLM 개발 도구");

    expect(news).toHaveLength(3);
    expect(news.every((item) => item.title.startsWith("[샘플]"))).toBe(true);
    expect(progress.demo).toBe(true);
    expect(progress.items.length).toBeGreaterThan(0);
  });

  test("채팅 응답은 샘플임을 명시한다", () => {
    expect(getSampleChatReply("wiki", "에이전트는 어떻게 평가해?")).toContain("[샘플 응답]");
  });
});
