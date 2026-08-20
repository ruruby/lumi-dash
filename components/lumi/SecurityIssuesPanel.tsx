import { GlassPanel } from "@/components/lumi/GlassPanel";
import { TEXT_FAINT, TEXT_MUTED } from "@/lib/lumi-theme";
import type { SecurityIssue } from "@/lib/overview-types";

type SecurityIssuesPanelProps = {
  issues: SecurityIssue[];
  analyzed: boolean;
  newsCount: number;
};

const SEVERITY_STYLE: Record<SecurityIssue["severity"], { dot: string; label: string; color: string }> = {
  high: { dot: "🔴", label: "높음", color: "#e6a3a3" },
  medium: { dot: "🟠", label: "중간", color: "#e8c07f" },
  low: { dot: "🟡", label: "낮음", color: "#a9bce4" },
};

export function SecurityIssuesPanel({ issues, analyzed, newsCount }: SecurityIssuesPanelProps) {
  return (
    <GlassPanel className="w-full" fill hoverable cornerColor="#b45a5a">
      <div className="flex items-center justify-between mb-1">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Major Security Issues</div>
        <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>기사 {newsCount}건에서 사건 단위로 묶음</span>
      </div>

      {!analyzed && (
        <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          AI 분석을 실행하면 같은 사건을 다룬 기사들을 묶어서 보여드려요.
        </p>
      )}

      {analyzed && issues.length === 0 && (
        <p className="mt-3 text-[12.5px]" style={{ color: TEXT_MUTED }}>
          지금 수집된 기사 중에는 사건 단위로 묶을 만한 주요 보안 사건이 없어요.
        </p>
      )}

      {issues.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          {issues.map((issue) => {
            const style = SEVERITY_STYLE[issue.severity];
            return (
              <div
                key={issue.title}
                style={{ borderLeft: `2px solid ${style.color}` }}
                className="pl-2.5"
              >
                <div className="flex items-start gap-1.5">
                  <span style={{ fontSize: 10 }} className="mt-0.5">
                    {style.dot}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#eceaf3" }} className="leading-snug">
                    {issue.title}
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: style.color }} className="mt-1">
                  {issue.issueType}
                  {issue.impact ? ` · ${issue.impact}` : ""} · 중요도 {style.label}
                </div>
                {issue.summary && (
                  <div style={{ fontSize: 10.5, color: "rgba(236,234,243,0.6)" }} className="mt-1 leading-snug">
                    {issue.summary}
                  </div>
                )}
                {issue.articleLinks.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {issue.articleLinks.slice(0, 5).map((link, index) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#a9bce4", fontSize: 9.5 }}
                        className="hover:underline"
                      >
                        관련 기사 {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
