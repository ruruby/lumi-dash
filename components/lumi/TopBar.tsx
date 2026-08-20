import { ACCENT, SPACE_GROTESK } from "@/lib/lumi-theme";

export function TopBar() {
  return (
    <header
      style={{
        background: "rgba(12,15,30,0.35)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(201,154,75,0.14)",
      }}
      className="relative flex items-center justify-between h-20 px-8 shrink-0"
    >
      <div
        className="absolute bottom-[-1px] left-8"
        style={{ width: 220, height: 2, background: "linear-gradient(90deg, #c99a4b, transparent)" }}
      />

      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1.5">
          <h1
            style={{ fontFamily: SPACE_GROTESK, fontWeight: 700, fontSize: 19, letterSpacing: 0.5, color: "#fff" }}
            className="m-0"
          >
            LUMI
          </h1>
          <span style={{ color: ACCENT, fontSize: 12 }}>✦</span>
        </div>
        <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.12)" }} />
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontFamily: SPACE_GROTESK,
              fontSize: 18,
              fontWeight: 600,
              color: ACCENT,
              textShadow: "0 0 18px rgba(201,154,75,0.25)",
            }}
          >
            Light Up My Insight
          </span>
          <span style={{ fontSize: 11.5, color: "rgba(236,234,243,0.45)" }}>
            지식을 비추는 빛이 되어, 더 나은 기술적 결정을 돕습니다.
          </span>
        </div>
      </div>

      <div
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center relative"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,154,75,0.2)" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#eceaf3" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 4-2 5-2 7h16c0-2-2-3-2-7" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        <span
          className="absolute rounded-full"
          style={{
            top: 6,
            right: 7,
            width: 7,
            height: 7,
            background: ACCENT,
            boxShadow: `0 0 6px ${ACCENT}`,
            border: "1.5px solid #0c0f1e",
          }}
        />
      </div>
    </header>
  );
}
