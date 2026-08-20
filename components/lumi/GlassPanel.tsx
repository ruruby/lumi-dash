import { CSSProperties, ReactNode } from "react";
import { GLASS_STYLE } from "@/lib/lumi-theme";
import { CornerAccent } from "@/components/lumi/CornerAccent";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hoverable?: boolean;
  cornerColor?: string;
  /** Take the remaining column height and scroll internally instead of growing the page. */
  fill?: boolean;
};

export function GlassPanel({ children, className, style, hoverable, cornerColor, fill }: GlassPanelProps) {
  return (
    <div
      style={{ ...GLASS_STYLE, ...style, position: "relative" }}
      className={`rounded-[18px] p-5 flex flex-col min-w-0 min-h-0 ${
        fill ? "flex-1 overflow-y-auto lumi-scroll" : ""
      } ${hoverable ? "lumi-glass-hoverable" : ""} ${className ?? ""}`}
    >
      {cornerColor && <CornerAccent color={cornerColor} />}
      {children}
    </div>
  );
}
