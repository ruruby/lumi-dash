export type DockView = "panorama" | "trends" | "inbox" | "signals" | "knowledge" | "settings" | "profile";

type BottomDockProps = {
  activeView: DockView;
  onNavigate: (view: DockView) => void;
  /** Unhandled candidate count across every category. 0 hides the badge. */
  inboxCount?: number;
};

const ACTIVE_STYLE = {
  background: "linear-gradient(160deg, rgba(201,154,75,0.28), rgba(201,154,75,0.1))",
  border: "1px solid rgba(201,154,75,0.35)",
  boxShadow: "0 0 16px rgba(201,154,75,0.25)",
};

function strokeFor(isActive: boolean): string {
  return isActive ? "#e8c07f" : "rgba(236,234,243,0.62)";
}

// Floating icon dock from design/dashboard_preview.html. Dashboard, trends,
// Research Inbox, knowledge, and settings navigate; the profile icon opens the
// vault activity view.
export function BottomDock({ activeView, onNavigate, inboxCount = 0 }: BottomDockProps) {
  return (
    <nav
      style={{
        background: "linear-gradient(160deg, rgba(45,54,92,0.55), rgba(20,24,46,0.65))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(201,154,75,0.22)",
        boxShadow: "0 14px 34px rgba(3,5,14,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
      }}
      className="fixed left-1/2 bottom-[18px] -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2.5 rounded-[22px]"
    >
      <button
        onClick={() => onNavigate("panorama")}
        style={activeView === "panorama" ? ACTIVE_STYLE : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="대시보드"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeFor(activeView === "panorama")} strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
        {activeView === "panorama" && (
          <span
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: "#c99a4b", boxShadow: "0 0 6px #c99a4b" }}
          />
        )}
      </button>

      <div className="w-px h-7 mx-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />

      <button
        onClick={() => onNavigate("trends")}
        style={activeView === "trends" ? ACTIVE_STYLE : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="동향"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeFor(activeView === "trends")} strokeWidth="2">
          <path d="M3 17l5-5 4 4 9-9" />
          <path d="M14 7h7v7" />
        </svg>
        {activeView === "trends" && (
          <span
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: "#c99a4b", boxShadow: "0 0 6px #c99a4b" }}
          />
        )}
      </button>

      {/* Research Inbox — the collector's entry point, with a count of unreviewed candidates. */}
      <button
        onClick={() => onNavigate("inbox")}
        style={activeView === "inbox" ? ACTIVE_STYLE : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="Research Inbox"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeFor(activeView === "inbox")} strokeWidth="2">
          <path d="M3 13h4l2 3h6l2-3h4" />
          <path d="M5 13V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8" />
          <path d="M3 13v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
        </svg>
        {inboxCount > 0 && (
          <span
            style={{
              background: "#c99a4b",
              color: "#1a1206",
              boxShadow: "0 0 8px rgba(201,154,75,0.6)",
              border: "1.5px solid #101428",
            }}
            className="absolute -top-1 -right-1 min-w-[18px] rounded-full px-1 text-center text-[9.5px] font-bold leading-[16px]"
          >
            {inboxCount > 99 ? "99+" : inboxCount}
          </span>
        )}
        {activeView === "inbox" && (
          <span
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: "#c99a4b", boxShadow: "0 0 6px #c99a4b" }}
          />
        )}
      </button>

      {/* News & Signals — a read-only glance feed, not the Research Inbox triage screen. */}
      <button
        onClick={() => onNavigate("signals")}
        style={activeView === "signals" ? ACTIVE_STYLE : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="News & Signals"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeFor(activeView === "signals")} strokeWidth="2">
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1.5" fill={activeView === "signals" ? "#e8c07f" : "rgba(236,234,243,0.62)"} stroke="none" />
        </svg>
        {activeView === "signals" && (
          <span
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: "#c99a4b", boxShadow: "0 0 6px #c99a4b" }}
          />
        )}
      </button>

      <button
        onClick={() => onNavigate("knowledge")}
        style={activeView === "knowledge" ? ACTIVE_STYLE : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="지식 DB"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeFor(activeView === "knowledge")} strokeWidth="2">
          <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
          <path d="M3.3 7l8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
        {activeView === "knowledge" && (
          <span
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: "#c99a4b", boxShadow: "0 0 6px #c99a4b" }}
          />
        )}
      </button>

      <div className="w-px h-7 mx-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />

      {/* 환경설정 — where sample mode is switched on and off. */}
      <button
        onClick={() => onNavigate("settings")}
        style={activeView === "settings" ? ACTIVE_STYLE : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="환경설정"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strokeFor(activeView === "settings")} strokeWidth="2">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {activeView === "settings" && (
          <span
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: "#c99a4b", boxShadow: "0 0 6px #c99a4b" }}
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => onNavigate("profile")}
        className="lumi-dock-btn w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 32% 28%, #6f86bd, #3a4568 60%, #1c2340 100%)",
          boxShadow: "0 0 14px rgba(90,110,150,0.45)",
        }}
        title="내 활동"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eceaf3" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
        </svg>
      </button>
    </nav>
  );
}
