export const TECH_STAGES = ["탐색", "연구", "프로토타입", "상용화"] as const;
export type TechStage = (typeof TECH_STAGES)[number];

export type TechProgressItem = {
  keyword: string;
  stage: TechStage;
  reason: string;
};

export type TechProgressResult = {
  overview: string;
  items: TechProgressItem[];
};
