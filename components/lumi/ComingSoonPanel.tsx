import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";

type ComingSoonPanelProps = {
  title: string;
  description: string;
};

export function ComingSoonPanel({ title, description }: ComingSoonPanelProps) {
  return (
    <GlassPanel className="items-center justify-center text-center gap-2 min-h-[200px]">
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{title}</div>
      <p style={{ fontSize: 11.5, color: TEXT_MUTED }} className="max-w-xs">
        {description}
      </p>
      <span style={{ fontSize: 10, color: TEXT_FAINT }}>다음 업데이트에서 추가될 예정이에요</span>
    </GlassPanel>
  );
}
