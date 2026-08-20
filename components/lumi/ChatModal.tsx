"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { NewsResult } from "@/lib/useCategoryNews";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatSource = "wiki" | "news";

type ChatModalProps = {
  open: boolean;
  onClose: () => void;
  categoryName: string | null;
  newsItems: NewsResult[];
  vaultPath: string;
  vaultFolder: string;
  vaultNoteCount: number;
  demoMode?: boolean;
};

export function ChatModal({
  open,
  onClose,
  categoryName,
  newsItems,
  vaultPath,
  vaultFolder,
  vaultNoteCount,
  demoMode = false,
}: ChatModalProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [source, setSource] = useState<ChatSource>("wiki");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (demoMode) {
      setAvailable(true);
      return;
    }
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => setAvailable(Boolean(data.available)))
      .catch(() => setAvailable(false));
  }, [open, demoMode, vaultPath]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  if (!open) return null;

  const wikiReady = Boolean(vaultPath) && vaultNoteCount > 0;
  const newsReady = Boolean(categoryName) && newsItems.length > 0;
  const activeReady = source === "wiki" ? wikiReady : newsReady;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          vaultPath,
          folder: vaultFolder,
          categoryName,
          demoMode,
          newsContext: newsItems.map((item) => ({
            title: item.title,
            summary: item.summary,
            link: item.link,
          })),
          history: nextMessages,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "답변을 가져오지 못했어요.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("네트워크 오류로 답변을 가져오지 못했어요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ background: "rgba(4,5,12,0.6)", backdropFilter: "blur(3px)" }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, rgba(45,54,92,0.42), rgba(20,24,46,0.5))",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(201,154,75,0.32)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        }}
        className="w-[840px] max-w-[92vw] h-[560px] max-h-[88vh] rounded-[18px] flex overflow-hidden"
      >
        {/* LEFT: LUMI avatar */}
        <div
          style={{ width: 260, background: "rgb(237,235,233)", borderRight: "1px solid rgba(201,154,75,0.2)" }}
          className="shrink-0 flex flex-col items-center justify-center p-6 relative"
        >
          <div className="relative w-[170px] h-[170px]">
            <Image src="/lumi/lumi_logo_chat.png" alt="LUMI" fill sizes="170px" className="object-contain" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#2b2620" }} className="mt-3">
            LUMI
          </div>
          <div style={{ fontSize: 11, color: "rgba(43,38,32,0.6)" }} className="mt-1 text-center">
            {source === "wiki" ? "내 LLM Wiki 기반 어시스턴트" : "수집된 뉴스 기반 어시스턴트"}
          </div>
          {activeReady && (
            <div
              style={{
                color: "#3f8a5c",
                background: "rgba(95,168,118,0.16)",
                border: "1px solid rgba(95,168,118,0.35)",
              }}
              className="mt-2.5 flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full"
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3f8a5c" }} />
              {source === "wiki" ? `노트 ${vaultNoteCount}개 연결됨` : `뉴스 ${newsItems.length}건 연결됨`}
            </div>
          )}
        </div>

        {/* RIGHT: chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            className="shrink-0 flex items-center justify-between px-5"
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>LUMI와 대화하기</span>
              <div className="flex items-center gap-1">
                {(["wiki", "news"] as ChatSource[]).map((option) => {
                  const isActive = source === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setSource(option)}
                      style={
                        isActive
                          ? {
                              background: "rgba(201,154,75,0.22)",
                              border: "1px solid rgba(201,154,75,0.5)",
                              color: "#f0d6a0",
                            }
                          : {
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "rgba(236,234,243,0.6)",
                            }
                      }
                      className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    >
                      {option === "wiki" ? "위키" : "뉴스"}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={onClose} style={{ fontSize: 16, color: "rgba(236,234,243,0.4)" }}>
              ✕
            </button>
          </div>

          {available === false ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p style={{ fontSize: 12.5, color: "#e6a3a3" }}>
                LUMI 채팅은 로컬에서 이 앱을 실행할 때만 사용할 수 있어요. (claude CLI가 감지되지 않았어요.)
              </p>
            </div>
          ) : !activeReady ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p style={{ fontSize: 12.5, color: "rgba(236,234,243,0.6)" }}>
                {source === "wiki"
                  ? "먼저 Obsidian vault를 연결해주세요. 그래야 LUMI가 내 노트를 근거로 답할 수 있어요."
                  : "먼저 카테고리를 선택하고 뉴스를 모아주세요. 그래야 LUMI가 뉴스를 근거로 답할 수 있어요."}
              </p>
            </div>
          ) : (
            <>
              <div ref={listRef} className="lumi-scroll flex-1 p-5 flex flex-col gap-3 overflow-auto">
                {messages.length === 0 && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#eceaf3",
                    }}
                    className="rounded-[14px] rounded-bl-[4px] px-3.5 py-2.5 text-[12.5px] leading-relaxed max-w-[88%]"
                  >
                    안녕하세요! 저는 LUMI예요 ✦{" "}
                    {source === "wiki"
                      ? `연결된 노트 ${vaultNoteCount}개를 바탕으로 답변해 드릴게요.`
                      : `${categoryName} 카테고리에 모은 뉴스를 바탕으로 답변해 드릴게요.`}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={
                      message.role === "user"
                        ? {
                            alignSelf: "flex-end",
                            background: "linear-gradient(135deg, rgba(201,154,75,0.28), rgba(201,154,75,0.14))",
                            border: "1px solid rgba(201,154,75,0.35)",
                            color: "#f5efe3",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#eceaf3",
                          }
                    }
                    className="rounded-[14px] px-3.5 py-2.5 text-[12.5px] leading-relaxed max-w-[85%] whitespace-pre-line"
                  >
                    {message.content}
                  </div>
                ))}
                {sending && (
                  <div style={{ color: "rgba(236,234,243,0.5)" }} className="text-[11.5px]">
                    LUMI가 답변을 준비하는 중...
                  </div>
                )}
                {error && (
                  <div style={{ color: "#e6a3a3" }} className="text-[11.5px]">
                    {error}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-4 flex items-center gap-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="궁금한 내용을 물어보세요"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(201,154,75,0.25)",
                    color: "#eceaf3",
                  }}
                  className="flex-1 rounded-xl px-3.5 py-2.5 text-[12px] outline-none placeholder:text-[rgba(236,234,243,0.4)]"
                />
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    background: "radial-gradient(circle at 32% 28%, #f0d6a0, #c99a4b 70%)",
                    color: "#0c0f1e",
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  →
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
