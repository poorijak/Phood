export type Mode = "picture" | "describe" | "sentence" | "question";
export type Level = 1 | 2 | 3;

export type Item = {
  id: string;
  level: Level;
  stage: number;
  mode: Mode;
  /** picture: คำตอบ · describe: คำตอบ (คำอธิบายอยู่ใน description) · sentence: ประโยค · question: คำถาม */
  text: string;
  emoji?: string;
  description?: string;
  accept?: string[];
};

export type ItemStatus = "correct" | "wrong" | "skipped" | "practiced";
export type ItemResult = { id: string; status: ItemStatus; cues: number; attempts: number };

export type Progress = {
  level: Level;
  stage: number; // 1-5
  failStreak: number;
  completed: boolean;
  placed: boolean;
  repeatIds: string[];
  history: { at: number; level: Level; stage: number; pct: number; passed: boolean }[];
};
