"use client";

import { useState, FormEvent } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { Category } from "@/lib/useCategories";

type CategoryKeywordManagerProps = {
  categories: Category[];
  selected: Category | null;
  onSelect: (id: string | null) => void;
  onAddCategory: (name: string, folder: string, select?: boolean) => void;
  onRemoveCategory: (id: string) => void;
  onAddKeyword: (id: string, keyword: string) => void;
  onRemoveKeyword: (id: string, keyword: string) => void;
  vaultConnected: boolean;
  vaultFolders: string[];
  onOpenKnowledgeDB: () => void;
};

const VAULT_ROOT_LABEL = "(vault 전체)";

export function CategoryKeywordManager({
  categories,
  selected,
  onSelect,
  onAddCategory,
  onRemoveCategory,
  onAddKeyword,
  onRemoveKeyword,
  vaultConnected,
  vaultFolders,
  onOpenKnowledgeDB,
}: CategoryKeywordManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  // Folders that have not been turned into a category yet.
  const usedFolders = new Set(categories.map((c) => c.folder));
  const unusedFolders = vaultFolders.filter((folder) => !usedFolders.has(folder));

  function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    // Hand-typed categories default to the vault root; a real folder is picked
    // via the suggestion chips below instead of a second control here.
    onAddCategory(name, "");
    setNewCategoryName("");
  }

  function handleAddKeyword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = newKeyword.trim();
    if (!keyword || !selected) return;
    onAddKeyword(selected.id, keyword);
    setNewKeyword("");
  }

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
      {!selected && (
        <>
          {!vaultConnected && (
            <button
              onClick={onOpenKnowledgeDB}
              style={{
                background: "rgba(122,142,196,0.1)",
                border: "1px dashed rgba(122,142,196,0.4)",
                color: "#a9bce4",
              }}
              className="text-left rounded-xl px-3 py-2.5 mb-3 text-[11px] leading-snug"
            >
              지식 DB 화면에서 Obsidian vault를 연결하면, 그 폴더들을 카테고리로 바로 추가할 수 있어요 ›
            </button>
          )}

          {/* The vault's subfolders already name the topics, so offer them directly
              instead of making the user retype each one. Adding stays a deliberate click. */}
          {vaultConnected && unusedFolders.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: 10, color: TEXT_FAINT }}>
                  vault에서 찾은 폴더 · 클릭하면 카테고리로 추가돼요
                </span>
                {unusedFolders.length > 1 && (
                  <button
                    onClick={() => unusedFolders.forEach((folder) => onAddCategory(folder, folder, false))}
                    style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }}
                  >
                    모두 추가
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unusedFolders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => onAddCategory(folder, folder, false)}
                    style={{
                      background: "rgba(122,142,196,0.12)",
                      border: "1px dashed rgba(122,142,196,0.45)",
                      color: "#a9bce4",
                    }}
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                  >
                    + {folder}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }} className="mb-0.5">
            전체 카테고리
          </div>
          <div style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mb-3">
            관심 주제를 만들어보세요
          </div>

          <form onSubmit={handleAddCategory} className="flex items-center gap-1.5 mb-3.5">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="카테고리 추가..."
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#eceaf3",
              }}
              className="flex-1 min-w-0 rounded-[10px] px-2.5 py-2 text-[11.5px] outline-none placeholder:text-[rgba(236,234,243,0.35)]"
            />
            <button
              type="submit"
              style={{ background: "rgba(201,154,75,0.3)", color: "#f0d6a0" }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[13px] shrink-0"
            >
              +
            </button>
          </form>

          {categories.length === 0 && (
            <p style={{ fontSize: 11.5, color: TEXT_MUTED }}>
              아직 카테고리가 없어요. 위에서 하나 추가해보세요.
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => onSelect(category.id)}
                style={{
                  background: "rgba(201,154,75,0.08)",
                  border: "1px solid rgba(201,154,75,0.24)",
                }}
                className="cursor-pointer rounded-xl p-3.5 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#eceaf3" }}>{category.name}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED }} className="mt-1 truncate">
                    📁 {category.folder || VAULT_ROOT_LABEL} · 키워드 {category.keywords.length}개
                  </div>
                </div>
                <span style={{ color: "#e8c07f", fontSize: 14 }} className="shrink-0 ml-2">
                  ›
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <>
          <div className="flex items-center justify-between mb-0.5">
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{selected.name}</div>
            <button
              onClick={() => onSelect(null)}
              style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }}
              className="cursor-pointer shrink-0 ml-2"
            >
              ‹ 전체 카테고리
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mb-3">
            📁 {selected.folder || VAULT_ROOT_LABEL}
          </div>

          <div style={{ fontSize: 10.5, color: TEXT_FAINT }} className="mb-1.5">
            뉴스 키워드
          </div>
          <form onSubmit={handleAddKeyword} className="flex items-center gap-1.5 mb-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="키워드 추가..."
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#eceaf3",
              }}
              className="flex-1 min-w-0 rounded-[10px] px-2.5 py-2 text-[11.5px] outline-none placeholder:text-[rgba(236,234,243,0.35)]"
            />
            <button
              type="submit"
              style={{ background: "rgba(201,154,75,0.3)", color: "#f0d6a0" }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[13px] shrink-0"
            >
              +
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {selected.keywords.length === 0 && (
              <p style={{ fontSize: 11, color: "rgba(236,234,243,0.4)" }}>아직 키워드가 없어요.</p>
            )}
            {selected.keywords.map((keyword) => (
              <span
                key={keyword}
                onClick={() => onRemoveKeyword(selected.id, keyword)}
                style={{
                  background: "rgba(201,154,75,0.16)",
                  border: "1px solid rgba(201,154,75,0.4)",
                  color: "#e8c07f",
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
              >
                {keyword} ✕
              </span>
            ))}
          </div>

          <button
            onClick={() => onRemoveCategory(selected.id)}
            style={{ color: "rgba(236,234,243,0.4)" }}
            className="mt-auto cursor-pointer text-[10.5px] self-start"
          >
            카테고리 삭제
          </button>
        </>
      )}
    </GlassPanel>
  );
}
