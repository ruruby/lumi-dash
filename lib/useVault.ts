"use client";

import { useCallback, useEffect, useState } from "react";

export type VaultGraphNote = {
  title: string;
  relativePath: string;
  links: string[];
};

export type VaultState =
  | { status: "unset" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; notes: VaultGraphNote[]; truncated: boolean; totalFound: number };

const STORAGE_KEY = "lumi.vaultPath";

/** The vault root is global and set once; folders inside it are picked per category. */
export function useVaultRoot() {
  const [vaultPath, setVaultPathState] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setVaultPathState(saved);
    setHydrated(true);
  }, []);

  const setVaultPath = useCallback((next: string) => {
    setVaultPathState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const trimmed = vaultPath.trim();
    if (!trimmed) {
      setFolders([]);
      setRootError(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/vault?mode=folders&path=${encodeURIComponent(trimmed)}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setFolders([]);
          setRootError(data.error ?? "vault를 읽지 못했어요.");
          return;
        }
        setFolders(data.folders ?? []);
        setRootError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setFolders([]);
          setRootError("네트워크 오류로 vault를 읽지 못했어요.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath, hydrated]);

  return { vaultPath, setVaultPath, folders, rootError, hydrated };
}

/** Notes for one category's folder scope within the vault root. */
export function useVaultNotes(vaultPath: string, folder: string | null): VaultState {
  const [state, setState] = useState<VaultState>({ status: "unset" });

  useEffect(() => {
    const trimmed = vaultPath.trim();
    if (!trimmed || folder === null) {
      setState({ status: "unset" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    const query = `path=${encodeURIComponent(trimmed)}&folder=${encodeURIComponent(folder)}`;
    fetch(`/api/vault?${query}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({ status: "error", message: data.error ?? "노트를 읽지 못했어요." });
          return;
        }
        setState({
          status: "ready",
          notes: data.notes,
          truncated: Boolean(data.truncated),
          totalFound: data.totalFound ?? data.notes.length,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "네트워크 오류로 노트를 읽지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath, folder]);

  return state;
}
