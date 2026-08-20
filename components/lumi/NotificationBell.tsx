"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENT, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { NotificationItem } from "@/lib/useNotifications";

/**
 * Two sources merged into one dropdown: News & Signals items and unreviewed
 * Research Inbox candidates. Opening the dropdown marks everything currently
 * listed as seen — there is no per-item read state, see
 * docs/specs/notification-tracking/spec.md.
 */
type NotificationBellProps = {
  items: NotificationItem[];
  unreadCount: number;
  onOpen: () => void;
  onSelectItem: (item: NotificationItem) => void;
};

function formatRelativeTime(at: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - at) / (60 * 1000)));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const KIND_LABEL: Record<NotificationItem["kind"], string> = {
  signal: "News & Signals",
  inboxCandidate: "Research Inbox",
};

export function NotificationBell({ items, unreadCount, onOpen, onSelectItem }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Computed once per mount — the dropdown's relative times don't need to tick live.
  const now = useMemo(() => new Date().getTime(), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) onOpen();
  }

  function handleSelect(item: NotificationItem) {
    setOpen(false);
    onSelectItem(item);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="알림"
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center relative"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,154,75,0.2)" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#eceaf3" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 4-2 5-2 7h16c0-2-2-3-2-7" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute rounded-full flex items-center justify-center"
            style={{
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              background: ACCENT,
              color: "#1a1206",
              fontSize: 9.5,
              fontWeight: 700,
              boxShadow: `0 0 6px ${ACCENT}`,
              border: "1.5px solid #0c0f1e",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            background: "linear-gradient(160deg, rgba(45,54,92,0.95), rgba(16,20,38,0.98))",
            border: "1px solid rgba(201,154,75,0.25)",
            boxShadow: "0 18px 40px rgba(3,5,14,0.5)",
          }}
          className="absolute right-0 top-[calc(100%+10px)] z-30 w-[320px] rounded-[16px] p-3"
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff" }} className="mb-2 px-1">
            알림
          </div>

          {items.length === 0 ? (
            <p className="px-1 py-3 text-[12px]" style={{ color: TEXT_MUTED }}>
              새 알림이 없어요.
            </p>
          ) : (
            <ul className="lumi-scroll flex max-h-[360px] flex-col overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item)}
                    className="flex w-full flex-col gap-1 rounded-xl px-2.5 py-2 text-left hover:bg-white/5"
                  >
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: ACCENT }}>{KIND_LABEL[item.kind]}</span>
                    <span style={{ fontSize: 12, color: "#eceaf3" }} className="leading-snug">
                      {item.title}
                    </span>
                    <span style={{ fontSize: 10, color: TEXT_FAINT }}>{formatRelativeTime(item.at, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
