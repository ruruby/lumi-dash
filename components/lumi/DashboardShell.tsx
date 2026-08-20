import { ReactNode } from "react";

type DashboardShellProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

// Column widths mirror design/dashboard_preview.html's 3-column grid.
// The page itself never scrolls; only the news column scrolls internally, so
// it alone gets the flexible (1fr) row/height while left/center size to content.
export function DashboardShell({ left, center, right }: DashboardShellProps) {
  return (
    <main className="grid flex-1 min-h-0 gap-5 px-8 py-8 pb-24 grid-cols-1 grid-rows-[auto_auto_1fr] md:grid-cols-[270px_1fr_300px] md:grid-rows-1">
      {left}
      {center}
      {right}
    </main>
  );
}
