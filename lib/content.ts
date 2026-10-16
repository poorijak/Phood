import { ITEMS } from "./content.generated";
import type { Item, Level } from "./types";

export const allItems = ITEMS;

export function stageItems(level: Level, stage: number): Item[] {
  return ITEMS.filter((i) => i.level === level && i.stage === stage);
}

/** ลำดับในด่าน: รูปภาพ → คำอธิบาย → ประโยค → ตอบคำถาม */
const ORDER = { picture: 0, describe: 1, sentence: 2, question: 3 } as const;
export function stageSession(level: Level, stage: number): Item[] {
  const base = stageItems(level, stage);
  return [...base].sort((a, b) => ORDER[a.mode] - ORDER[b.mode]);
}

export const MODE_LABEL = {
  picture: "บอกชื่อสิ่งนี้",
  describe: "ฟังคำใบ้ แล้วบอกว่าคืออะไร",
  sentence: "พูดตามประโยค",
  question: "คุยกับโค้ช",
} as const;
