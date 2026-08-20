"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Category = {
  id: string;
  name: string;
  /** Folder inside the vault root this category's notes live in. "" means the vault root itself. */
  folder: string;
  keywords: string[];
};

const STORAGE_KEY = "lumi.categories";

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "sample-llm-core",
    name: "LLM 핵심 기술",
    folder: "LLM 핵심 기술",
    keywords: ["large language model", "RAG", "LLM agent", "multimodal LLM"],
  },
  {
    id: "sample-llm-tools",
    name: "LLM 개발 도구",
    folder: "LLM 개발 도구",
    keywords: ["LLM developer tools", "AI coding agent", "LangGraph", "LLM observability"],
  },
];

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Math.random()}`;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Category[] = JSON.parse(raw);
        // Categories saved before folder scoping existed default to the vault root.
        setCategories(parsed.map((c) => ({ ...c, folder: c.folder ?? "" })));
      } catch {
        // ignore malformed storage
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories, hydrated]);

  const selected = useMemo(
    () => categories.find((c) => c.id === selectedId) ?? null,
    [categories, selectedId],
  );

  /**
   * `select` opens the new category right away — right for a hand-typed one,
   * wrong for a bulk add where the user is still building the list.
   */
  const addCategory = useCallback((name: string, folder: string, select = true) => {
    const category: Category = { id: createId(), name, folder, keywords: [] };
    setCategories((prev) => [...prev, category]);
    if (select) setSelectedId(category.id);
  }, []);

  const removeCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [],
  );

  const addKeyword = useCallback((id: string, keyword: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id && !c.keywords.includes(keyword) ? { ...c, keywords: [...c.keywords, keyword] } : c,
      ),
    );
  }, []);

  const removeKeyword = useCallback((id: string, keyword: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, keywords: c.keywords.filter((k) => k !== keyword) } : c)),
    );
  }, []);

  const selectByFolder = useCallback(
    (folder: string) => {
      const match = categories.find((c) => c.folder === folder);
      if (match) setSelectedId(match.id);
    },
    [categories],
  );

  return {
    categories,
    selected,
    hydrated,
    select: setSelectedId,
    selectByFolder,
    addCategory,
    removeCategory,
    addKeyword,
    removeKeyword,
  };
}
