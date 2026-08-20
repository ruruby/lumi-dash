"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";

type KnowledgeBrowserProps = {
  vaultPath: string;
  onChangeVaultPath: (next: string) => void;
  vaultRootError: string | null;
};

type Note = { relativePath: string; title: string; content: string; updatedAt: number };

type FilesState =
  | { status: "unset" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; files: string[] };

type NoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; note: Note };

/** Group "folder/file.md" paths into folders, with vault-root files under "". */
function groupByFolder(files: string[]): { folder: string; files: { path: string; name: string }[] }[] {
  const groups = new Map<string, { path: string; name: string }[]>();

  for (const file of files) {
    const slash = file.lastIndexOf("/");
    const folder = slash === -1 ? "" : file.slice(0, slash);
    const name = (slash === -1 ? file : file.slice(slash + 1)).replace(/\.md$/i, "");
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder)!.push({ path: file, name });
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ko"))
    .map(([folder, entries]) => ({ folder, files: entries }));
}

export function KnowledgeBrowser({ vaultPath, onChangeVaultPath, vaultRootError }: KnowledgeBrowserProps) {
  const [filesState, setFilesState] = useState<FilesState>({ status: "unset" });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [noteState, setNoteState] = useState<NoteState>({ status: "idle" });
  const [vaultDraft, setVaultDraft] = useState(vaultPath);

  useEffect(() => {
    setVaultDraft(vaultPath);
  }, [vaultPath]);

  function handleConnectVault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChangeVaultPath(vaultDraft.trim());
  }

  useEffect(() => {
    if (!vaultPath) {
      setFilesState({ status: "unset" });
      return;
    }

    let cancelled = false;
    setFilesState({ status: "loading" });

    fetch(`/api/vault?mode=files&path=${encodeURIComponent(vaultPath)}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setFilesState({ status: "error", message: data.error ?? "파일 목록을 읽지 못했어요." });
          return;
        }
        setFilesState({ status: "ready", files: data.files ?? [] });
      })
      .catch(() => {
        if (!cancelled) setFilesState({ status: "error", message: "네트워크 오류로 목록을 읽지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath]);

  useEffect(() => {
    if (!vaultPath || !selectedPath) {
      setNoteState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setNoteState({ status: "loading" });

    const query = `mode=note&path=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(selectedPath)}`;
    fetch(`/api/vault?${query}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setNoteState({ status: "error", message: data.error ?? "노트를 열지 못했어요." });
          return;
        }
        setNoteState({ status: "ready", note: data });
      })
      .catch(() => {
        if (!cancelled) setNoteState({ status: "error", message: "네트워크 오류로 노트를 열지 못했어요." });
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath, selectedPath]);

  const grouped = useMemo(
    () => (filesState.status === "ready" ? groupByFolder(filesState.files) : []),
    [filesState],
  );
  const fileCount = filesState.status === "ready" ? filesState.files.length : 0;

  return (
    <div className="grid gap-5 h-full min-h-0 grid-cols-1 md:grid-cols-[300px_1fr]">
      {/* Left: the vault's folder/file structure */}
      <div className="flex flex-col min-w-0 h-full min-h-0">
        <GlassPanel className="w-full" fill hoverable cornerColor="#7a8ec4">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>지식 DB</div>
            <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>
              {filesState.status === "ready" ? `노트 ${fileCount}개` : "Obsidian vault"}
            </span>
          </div>

          <form onSubmit={handleConnectVault} className="flex items-center gap-1.5 mb-1.5 shrink-0">
            <input
              type="text"
              value={vaultDraft}
              onChange={(e) => setVaultDraft(e.target.value)}
              placeholder="vault 폴더 경로..."
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#eceaf3",
              }}
              className="flex-1 min-w-0 rounded-[10px] px-2.5 py-2 text-[11px] outline-none placeholder:text-[rgba(236,234,243,0.35)]"
            />
            <button
              type="submit"
              style={{ background: "rgba(122,142,196,0.3)", color: "#a9bce4" }}
              className="rounded-md px-2.5 py-1.5 text-[11px] font-bold shrink-0"
            >
              연결
            </button>
          </form>

          {vaultRootError && (
            <p style={{ fontSize: 10.5, color: "#e6a3a3" }} className="mb-2 shrink-0">
              {vaultRootError}
            </p>
          )}

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} className="mb-3 shrink-0" />

          {filesState.status === "unset" && (
            <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
              위에서 vault를 연결해주세요.
            </p>
          )}
          {filesState.status === "loading" && (
            <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
              파일 구조를 읽는 중...
            </p>
          )}
          {filesState.status === "error" && (
            <p className="text-[12.5px]" style={{ color: "#e6a3a3" }}>
              {filesState.message}
            </p>
          )}
          {filesState.status === "ready" && fileCount === 0 && (
            <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
              이 vault에서 마크다운 노트를 찾지 못했어요.
            </p>
          )}

          {grouped.map((group) => (
            <div key={group.folder || "__root__"} className="mb-3">
              <div
                style={{ fontSize: 10, fontWeight: 700, color: "#a9bce4" }}
                className="mb-1 flex items-center gap-1"
              >
                📁 {group.folder || "(vault 루트)"}
              </div>
              <div className="flex flex-col">
                {group.files.map((file) => {
                  const isActive = file.path === selectedPath;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedPath(file.path)}
                      style={
                        isActive
                          ? {
                              background: "rgba(201,154,75,0.18)",
                              border: "1px solid rgba(201,154,75,0.42)",
                              color: "#f0d6a0",
                            }
                          : { border: "1px solid transparent", color: "rgba(236,234,243,0.7)" }
                      }
                      className="text-left rounded-lg px-2 py-1.5 text-[11.5px] truncate hover:bg-[rgba(255,255,255,0.04)]"
                    >
                      {file.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </GlassPanel>
      </div>

      {/* Right: the selected note */}
      <div className="flex flex-col min-w-0 h-full min-h-0">
        <GlassPanel className="w-full" fill hoverable cornerColor="#c99a4b">
          {noteState.status === "idle" && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
                왼쪽에서 노트를 선택하면 내용을 보여드려요.
              </p>
            </div>
          )}

          {noteState.status === "loading" && (
            <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
              노트를 여는 중...
            </p>
          )}

          {noteState.status === "error" && (
            <p className="text-[12.5px]" style={{ color: "#e6a3a3" }}>
              {noteState.message}
            </p>
          )}

          {noteState.status === "ready" && (
            <>
              <div className="mb-2 shrink-0">
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{noteState.note.title}</div>
                <div style={{ fontSize: 10, color: TEXT_FAINT }} className="mt-0.5">
                  {noteState.note.relativePath} · 수정{" "}
                  {new Date(noteState.note.updatedAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
              <pre
                style={{ color: "rgba(236,234,243,0.82)", fontFamily: "inherit" }}
                className="text-[12px] leading-relaxed whitespace-pre-wrap break-words"
              >
                {noteState.note.content}
              </pre>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
