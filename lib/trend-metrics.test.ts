import { describe, expect, test } from "vitest";
import { buildTopicMetrics, classifyStatus, computeTrendPercent } from "@/lib/trend-metrics";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-08-20T00:00:00Z");

describe("computeTrendPercent", () => {
  test("두 구간이 모두 비어 있으면 비교 근거가 없으므로 null을 준다", () => {
    expect(computeTrendPercent(0, 0)).toBeNull();
  });

  test("직전 구간이 비어 있으면 증감률을 지어내지 않고 null을 준다", () => {
    expect(computeTrendPercent(5, 0)).toBeNull();
  });

  test("두 구간에 자료가 있으면 실제 증감률을 계산한다", () => {
    expect(computeTrendPercent(13, 10)).toBe(30);
    expect(computeTrendPercent(5, 10)).toBe(-50);
  });
});

describe("classifyStatus", () => {
  test("직전 자료가 없고 최근에만 생긴 주제는 Emerging으로 본다", () => {
    expect(classifyStatus({ recent: 4, prior: 0, trendPercent: null, noteCount: 4 })).toBe("Emerging");
  });

  test("크게 늘면 Hot, 크게 줄면 Declining", () => {
    expect(classifyStatus({ recent: 13, prior: 10, trendPercent: 30, noteCount: 5 })).toBe("Hot");
    expect(classifyStatus({ recent: 3, prior: 10, trendPercent: -70, noteCount: 5 })).toBe("Declining");
  });

  test("변화가 없으면 Stable", () => {
    expect(classifyStatus({ recent: 10, prior: 10, trendPercent: 0, noteCount: 5 })).toBe("Stable");
  });
});

describe("buildTopicMetrics", () => {
  test("최근 구간과 직전 구간의 자료를 실제 시각으로 갈라 센다", () => {
    const metrics = buildTopicMetrics({
      topic: "VEX",
      folder: "VEX",
      noteCount: 3,
      // 2 in the last 7 days, 1 in the 7 days before that.
      noteTimestamps: [NOW - 1 * DAY, NOW - 3 * DAY, NOW - 10 * DAY],
      // 2 in the last 7 days, 1 in the prior window.
      newsTimestamps: [NOW - 2 * DAY, NOW - 5 * DAY, NOW - 9 * DAY],
      now: NOW,
      windowDays: 7,
    });

    expect(metrics.recentNotes).toBe(2);
    expect(metrics.priorNotes).toBe(1);
    expect(metrics.recentNews).toBe(2);
    expect(metrics.priorNews).toBe(1);
    // recent 4 vs prior 2 → +100%
    expect(metrics.trendPercent).toBe(100);
    expect(metrics.status).toBe("Hot");
  });

  test("구간 밖의 오래된 자료는 어느 쪽에도 세지 않는다", () => {
    const metrics = buildTopicMetrics({
      topic: "옛 주제",
      folder: "old",
      noteCount: 1,
      noteTimestamps: [NOW - 90 * DAY],
      newsTimestamps: [],
      now: NOW,
      windowDays: 7,
    });

    expect(metrics.recentNotes).toBe(0);
    expect(metrics.priorNotes).toBe(0);
    expect(metrics.trendPercent).toBeNull();
  });
});
