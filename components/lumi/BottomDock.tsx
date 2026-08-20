export type DockView = "panorama" | "trends" | "knowledge";

type BottomDockProps = {
  activeView: DockView;
  onNavigate: (view: DockView) => void;
};

// Floating icon dock from design/dashboard_preview.html. Dashboard/trends/knowledge
// navigate; the profile icon has no destination yet.
export function BottomDock({ activeView, onNavigate }: BottomDockProps) {
  const activeStyle = {
    background: "linear-gradient(160deg, rgba(201,154,75,0.28), rgba(201,154,75,0.1))",
    border: "1px solid rgba(201,154,75,0.35)",
    boxShadow: "0 0 16px rgba(201,154,75,0.25)",
  };

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
        style={activeView === "panorama" ? activeStyle : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="대시보드"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeView === "panorama" ? "#e8c07f" : "rgba(236,234,243,0.62)"}
          strokeWidth="2"
        >
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
        style={activeView === "trends" ? activeStyle : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="동향"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeView === "trends" ? "#e8c07f" : "rgba(236,234,243,0.62)"}
          strokeWidth="2"
        >
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

      <button
        onClick={() => onNavigate("knowledge")}
        style={activeView === "knowledge" ? activeStyle : undefined}
        className="lumi-dock-btn relative w-[46px] h-[46px] rounded-2xl flex items-center justify-center"
        title="지식 DB"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeView === "knowledge" ? "#e8c07f" : "rgba(236,234,243,0.62)"}
          strokeWidth="2"
        >
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

      <div
        className="lumi-dock-btn w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 32% 28%, #6f86bd, #3a4568 60%, #1c2340 100%)",
          boxShadow: "0 0 14px rgba(90,110,150,0.45)",
        }}
        title="내 정보 (준비 중)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eceaf3" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
        </svg>
      </div>
    </nav>
  );
}
