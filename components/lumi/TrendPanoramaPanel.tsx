import { GlassPanel } from "@/components/lumi/GlassPanel";
import { ROTATING_PALETTE, TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { TopicMapNode } from "@/lib/overview-types";

type TrendPanoramaPanelProps = {
  topicMap: TopicMapNode[];
  onSelectTopic: (folder: string) => void;
};

const ROW_HEIGHT = 132;
const VIEW_WIDTH = 520;
const HUB_X = 78;

/**
 * Topic-level map: categories on the left, their subtopics fanned out to the right.
 * Deliberately not a document-level knowledge graph — that lives in the detail screen.
 */
export function TrendPanoramaPanel({ topicMap, onSelectTopic }: TrendPanoramaPanelProps) {
  const height = Math.max(topicMap.length * ROW_HEIGHT, ROW_HEIGHT);

  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#7a8ec4">
      <div className="flex items-center justify-between mb-1">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Trend Panorama</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>주제 수준 토픽 맵</span>
      </div>

      {topicMap.length === 0 ? (
        <p className="mt-4 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          카테고리를 만들면 전체 지형을 그려드려요.
        </p>
      ) : (
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} width="100%" height={height} className="mt-2">
          {topicMap.map((node, rowIndex) => {
            const color = ROTATING_PALETTE[rowIndex % ROTATING_PALETTE.length];
            const rowY = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
            const children = node.children;
            const childX = 300;

            return (
              <g key={node.folder + node.topic}>
                {children.map((child, childIndex) => {
                  const spread = (children.length - 1) / 2;
                  const childY = rowY + (childIndex - spread) * 19;
                  return (
                    <g key={child}>
                      <path
                        d={`M ${HUB_X + 8} ${rowY} C ${HUB_X + 90} ${rowY}, ${childX - 90} ${childY}, ${childX - 6} ${childY}`}
                        stroke={color}
                        strokeWidth={1.1}
                        fill="none"
                        opacity={0.32}
                      />
                      <circle cx={childX} cy={childY} r={2.6} fill={color} opacity={0.85} />
                      <text x={childX + 8} y={childY + 3.2} fontSize="9" fill="rgba(236,234,243,0.68)">
                        {child}
                      </text>
                    </g>
                  );
                })}

                <g
                  onClick={() => onSelectTopic(node.folder)}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={HUB_X} cy={rowY} r={8} fill={color} />
                  <text
                    x={HUB_X}
                    y={rowY - 15}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="800"
                    fill={color}
                  >
                    {node.topic}
                  </text>
                  <text
                    x={HUB_X}
                    y={rowY + 23}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="700"
                    fill="rgba(236,234,243,0.5)"
                  >
                    {node.status}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      )}

      {topicMap.length > 0 && (
        <p className="mt-1 text-[10px]" style={{ color: TEXT_FAINT }}>
          주제를 클릭하면 상세 화면으로 이동해요.
        </p>
      )}
    </GlassPanel>
  );
}
