"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
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

type PositionedNote = {
  title: string;
  links: string[];
  x: number;
  y: number;
  angle: number;
  color: string;
};

type GraphEdge = {
  from: PositionedNote;
  to: PositionedNote;
};

function ResearchGraph({
  positioned,
  edges,
}: {
  positioned: PositionedNote[];
  edges: GraphEdge[];
}) {
  const graphRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    viewBox: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: VIEW_WIDTH, height: VIEW_HEIGHT });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!event.ctrlKey || document.activeElement !== graph) return;

      // React delegates wheel events passively in some browsers. A native,
      // non-passive listener is needed to stop browser-level page zoom.
      event.preventDefault();

      const bounds = graph.getBoundingClientRect();
      setViewBox((current) => {
        const pointerX = current.x + ((event.clientX - bounds.left) / bounds.width) * current.width;
        const pointerY = current.y + ((event.clientY - bounds.top) / bounds.height) * current.height;
        const requestedScale = event.deltaY < 0 ? 0.85 : 1.15;
        const nextWidth = Math.min(VIEW_WIDTH, Math.max(VIEW_WIDTH / 4, current.width * requestedScale));
        const appliedScale = nextWidth / current.width;

        return {
          x: pointerX - (pointerX - current.x) * appliedScale,
          y: pointerY - (pointerY - current.y) * appliedScale,
          width: nextWidth,
          height: current.height * appliedScale,
        };
      });
    };

    graph.addEventListener("wheel", handleWheel, { passive: false });
    return () => graph.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;

    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      viewBox,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.clientX) / bounds.width) * drag.viewBox.width;
    const deltaY = ((event.clientY - drag.clientY) / bounds.height) * drag.viewBox.height;

    setViewBox({
      ...drag.viewBox,
      x: drag.viewBox.x - deltaX,
      y: drag.viewBox.y - deltaY,
    });
  };

  const finishDragging = (event: PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  const zoomPercent = Math.round((VIEW_WIDTH / viewBox.width) * 100);

  return (
    <div className="relative mt-2">
      <svg
        ref={graphRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        width="100%"
        height="280"
        className={`${dragging ? "cursor-grabbing" : "cursor-grab"} rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-[#7a8ec4]`}
        style={{ touchAction: "none" }}
        aria-label={`선택한 카테고리의 연구 노트 연결 그래프, 현재 ${zoomPercent}% 확대`}
        role="img"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
      >
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
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/35 px-2 py-1 text-[9.5px] text-white/45">
        드래그 이동 · Ctrl + 휠 확대 · {zoomPercent}%
      </span>
    </div>
  );
}

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
        <ResearchGraph key={folder} positioned={positioned} edges={edges} />
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
