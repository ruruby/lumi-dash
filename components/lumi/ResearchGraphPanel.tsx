import { GlassPanel } from "@/components/lumi/GlassPanel";
import { KnowledgeAnalysisSection } from "@/components/lumi/KnowledgeAnalysisSection";
import { ROTATING_PALETTE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { VaultState } from "@/lib/useVault";

type ResearchGraphPanelProps = {
  state: VaultState;
  vaultPath: string;
  folder: string;
};

const VIEW_WIDTH = 460;
const VIEW_HEIGHT = 300;
const CENTER_X = VIEW_WIDTH / 2;
const CENTER_Y = VIEW_HEIGHT / 2;
const RADIUS = 108;

export function ResearchGraphPanel({ state, vaultPath, folder }: ResearchGraphPanelProps) {
  const notes = state.status === "ready" ? state.notes : [];

  // Lay notes out on a circle; wikilinks become chords between them.
  const positioned = notes.map((note, index) => {
    const angle = (2 * Math.PI * index) / Math.max(notes.length, 1) - Math.PI / 2;
    return {
      ...note,
      x: CENTER_X + RADIUS * Math.cos(angle),
      y: CENTER_Y + RADIUS * Math.sin(angle),
      angle,
      color: ROTATING_PALETTE[index % ROTATING_PALETTE.length],
    };
  });

  const positionByTitle = new Map(positioned.map((note) => [note.title, note]));

  const edges = positioned.flatMap((note) =>
    note.links
      .map((target) => positionByTitle.get(target))
      .filter((target): target is (typeof positioned)[number] => Boolean(target))
      // Draw each undirected pair once.
      .filter((target) => note.title < target.title)
      .map((target) => ({ from: note, to: target })),
  );

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#7a8ec4">
      <div className="flex items-center justify-between mb-1">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>연구 동향</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>
          {state.status === "ready"
            ? `LLM Wiki 지식 그래프 · 노트 ${notes.length}개 · 링크 ${edges.length}개`
            : "LLM Wiki 지식 그래프"}
        </span>
      </div>

      {state.status === "unset" && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          왼쪽에서 Obsidian vault를 연결하면 지식 그래프를 그려드려요.
        </p>
      )}

      {state.status === "loading" && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          노트를 읽는 중...
        </p>
      )}

      {state.status === "error" && (
        <p className="mt-4 text-[12.5px]" style={{ color: "#e6a3a3" }}>
          {state.message}
        </p>
      )}

      {state.status === "ready" && notes.length === 0 && (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          이 vault에서 마크다운 노트를 찾지 못했어요.
        </p>
      )}

      {state.status === "ready" && notes.length > 0 && (
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="280" className="mt-2">
          {edges.map((edge) => (
            <line
              key={`${edge.from.title}->${edge.to.title}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke={edge.from.color}
              strokeWidth={1.2}
              opacity={0.35}
            />
          ))}

          {positioned.map((note) => {
            const isRight = Math.cos(note.angle) > 0.2;
            const isLeft = Math.cos(note.angle) < -0.2;
            const labelX = note.x + (isRight ? 11 : isLeft ? -11 : 0);
            const labelY = note.y + (isRight || isLeft ? 3.5 : Math.sin(note.angle) < 0 ? -11 : 17);
            const anchor = isRight ? "start" : isLeft ? "end" : "middle";

            return (
              <g key={note.title}>
                <circle
                  cx={note.x}
                  cy={note.y}
                  r={4 + Math.min(note.links.length, 4)}
                  fill={note.color}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  fontSize="9.5"
                  fontWeight="700"
                  fill={note.color}
                >
                  {note.title}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {state.status === "ready" && state.truncated && (
        <p className="mt-1 text-[10px]" style={{ color: TEXT_FAINT }}>
          노트가 많아 {notes.length}개까지만 그렸어요 (전체 {state.totalFound}개).
        </p>
      )}

      <KnowledgeAnalysisSection
        vaultPath={vaultPath}
        folder={folder}
        ready={state.status === "ready" && notes.length > 0}
      />
    </GlassPanel>
  );
}
