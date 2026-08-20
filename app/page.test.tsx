import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import Home from "@/app/page";

beforeEach(() => {
  window.localStorage.clear();
});

test("홈 화면은 LUMI 브랜드와 카테고리 추가 입력창을 보여준다", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1, name: "LUMI" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("카테고리 추가...")).toBeInTheDocument();
  expect(screen.getByText("아직 카테고리가 없어요. 위에서 하나 추가해보세요.")).toBeInTheDocument();
});
