import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import Home from "@/app/page";

beforeEach(() => {
  window.localStorage.clear();
});

test("홈 화면은 LUMI 브랜드와 기본 샘플 카테고리를 보여준다", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1, name: "LUMI" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("카테고리 추가...")).toBeInTheDocument();
  expect(screen.getByText("LLM 핵심 기술")).toBeInTheDocument();
  expect(screen.getByText("LLM 개발 도구")).toBeInTheDocument();
  expect(window.localStorage.getItem("lumi.vaultPath")).toBe("sample_vault");
});

test("기존 저장소 샘플 설정을 새 기본 샘플로 마이그레이션한다", () => {
  window.localStorage.setItem("lumi.vaultPath", "sample-vault");
  window.localStorage.setItem(
    "lumi.categories",
    JSON.stringify([
      { id: "legacy-security", name: "AI 보안", folder: "AI 보안", keywords: [] },
      { id: "legacy-supply", name: "공급망", folder: "공급망", keywords: [] },
    ]),
  );

  render(<Home />);

  expect(screen.getByText("LLM 핵심 기술")).toBeInTheDocument();
  expect(screen.getByText("LLM 개발 도구")).toBeInTheDocument();
  expect(window.localStorage.getItem("lumi.vaultPath")).toBe("sample_vault");
});
