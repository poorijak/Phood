import type { ItemResult, Level, Progress } from "./types";

export const INITIAL: Progress = {
  level: 1, stage: 1, failStreak: 0, completed: false, placed: false, repeatIds: [], history: [],
};

export function stagePercent(results: ItemResult[]) {
  const counted = results.filter((r) => r.status !== "skipped");
  const correct = counted.filter((r) => r.status === "correct").length;
  const skipped = results.length - counted.length;
  return {
    correct,
    counted: counted.length,
    skipped,
    pct: counted.length ? correct / counted.length : 0,
    skippedRatio: results.length ? skipped / results.length : 0,
  };
}

export type StageOutcome = "advance" | "levelup" | "finished" | "retry" | "demote";

/** ผ่าน: ≥80% ของข้อที่นับ (ข้อที่ข้ามไม่นับ) · ไม่ผ่าน 3 ครั้งติด → ลด 1 ด่าน */
export function applyStageResult(p: Progress, results: ItemResult[]): { next: Progress; outcome: StageOutcome; pct: number } {
  const s = stagePercent(results);
  const passed = s.counted > 0 && s.pct >= 0.8;
  const repeatIds = Array.from(new Set([...p.repeatIds, ...results.filter((r) => r.status === "practiced").map((r) => r.id)]));
  const history = [...p.history, { at: Date.now(), level: p.level, stage: p.stage, pct: s.pct, passed }];
  const next: Progress = { ...p, repeatIds, history };
  let outcome: StageOutcome;
  if (passed) {
    next.failStreak = 0;
    if (p.stage < 5) { next.stage = p.stage + 1; outcome = "advance"; }
    else if (p.level < 3) { next.level = (p.level + 1) as Level; next.stage = 1; outcome = "levelup"; }
    else { next.completed = true; outcome = "finished"; }
  } else {
    next.failStreak = p.failStreak + 1;
    outcome = "retry";
    if (next.failStreak >= 3) {
      next.failStreak = 0;
      if (p.stage > 1) { next.stage = p.stage - 1; outcome = "demote"; }
      else if (p.level > 1) { next.level = (p.level - 1) as Level; next.stage = 5; outcome = "demote"; }
    }
  }
  return { next, outcome, pct: s.pct };
}
