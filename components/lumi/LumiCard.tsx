import Image from "next/image";
import { ACCENT, GLASS_STYLE } from "@/lib/lumi-theme";

type LumiCardProps = {
  onOpenChat: () => void;
};

export function LumiCard({ onOpenChat }: LumiCardProps) {
  return (
    <div style={GLASS_STYLE} className="rounded-[18px] p-5 flex items-start gap-4 lumi-glass-hoverable">
      <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
        <div
          className="absolute rounded-full"
          style={{
            inset: -6,
            boxShadow: "0 0 14px 3px rgba(201,154,75,0.55)",
            animation: "lumi-glow 2.6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: 0,
            padding: 4,
            background: "linear-gradient(135deg, #ffe3a6, #d9b06a 45%, #c99a4b 75%, #ffe3a6)",
            animation: "lumi-pulse 2.8s ease-in-out infinite",
          }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center"
            style={{ background: "#f6f2ea" }}
          >
            <Image src="/lumi/lumi_tech_avatar.jpg" alt="LUMI" fill sizes="72px" className="object-contain" />
          </div>
        </div>
        <span
          className="absolute rounded-full"
          style={{
            top: -2,
            left: 14,
            width: 6,
            height: 6,
            background: "#fff3d6",
            boxShadow: "0 0 6px 2px rgba(255,235,190,0.95)",
            animation: "lumi-twinkle 1.8s ease-in-out infinite",
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: 27,
            right: -4,
            width: 6,
            height: 6,
            background: "#fff3d6",
            boxShadow: "0 0 6px 2px rgba(255,235,190,0.95)",
            animation: "lumi-twinkle 1.8s ease-in-out infinite 0.6s",
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            bottom: -2,
            left: 21,
            width: 6,
            height: 6,
            background: "#fff3d6",
            boxShadow: "0 0 6px 2px rgba(255,235,190,0.95)",
            animation: "lumi-twinkle 1.8s ease-in-out infinite 1.2s",
          }}
        />
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span style={{ fontWeight: 700, fontSize: 15, color: "#f5efe3" }}>LUMI</span>
          <span style={{ color: ACCENT, fontSize: 11 }}>✦</span>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(245,239,227,0.6)" }}>
          지식 DB 기반 대화
        </div>
        <button
          onClick={onOpenChat}
          style={{ background: "linear-gradient(135deg, #c99a4b, #d9b06a)", color: "#0c0f1e" }}
          className="self-start rounded-[11px] px-3 py-1.5 text-[11.5px] font-bold"
        >
          LUMI 호출
        </button>
      </div>
    </div>
  );
}
