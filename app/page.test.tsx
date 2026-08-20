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
});
