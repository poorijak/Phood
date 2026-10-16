import type { Item, ItemResult, Level } from "./types";

// 15 ข้อ จาก product/placement-test.md (ตัดคำลงท้ายครับ/ค่ะ)
export const PLACEMENT: Item[] = [
  { id: "P01", level: 1, stage: 1, mode: "picture", text: "นม", emoji: "🥛", accept: ["นม", "นมกล่อง", "นมวัว"] },
  { id: "P02", level: 1, stage: 2, mode: "picture", text: "หมวก", emoji: "🧢", accept: ["หมวก"] },
  { id: "P03", level: 1, stage: 2, mode: "picture", text: "นิ้ว", emoji: "☝️", accept: ["นิ้ว", "นิ้วมือ"] },
  { id: "P04", level: 1, stage: 1, mode: "sentence", text: "ขอยา", accept: ["ขอยา"] },
  { id: "P05", level: 1, stage: 2, mode: "sentence", text: "เจ็บมือ", accept: ["เจ็บมือ"] },
  { id: "P06", level: 2, stage: 1, mode: "picture", text: "กระป๋อง", emoji: "🥫", accept: ["กระป๋อง"] },
  { id: "P07", level: 2, stage: 2, mode: "picture", text: "ถุงมือ", emoji: "🧤", accept: ["ถุงมือ"] },
  { id: "P08", level: 2, stage: 1, mode: "describe", text: "กะละมัง", description: "ใช้ซักผ้าหรือล้างของ เป็นภาชนะกลมๆ ใส่น้ำ", accept: ["กะละมัง", "อ่าง"] },
  { id: "P09", level: 2, stage: 2, mode: "sentence", text: "วันนี้ฝนจะตกไหม", accept: ["วันนี้ฝนจะตกไหม"] },
  { id: "P10", level: 2, stage: 3, mode: "sentence", text: "ช่วยปิดหน้าต่างให้หน่อย", accept: ["ช่วยปิดหน้าต่างให้หน่อย"] },
  { id: "P11", level: 3, stage: 3, mode: "picture", text: "ปั่นจักรยาน", emoji: "🚴", accept: ["ปั่นจักรยาน", "ขี่จักรยาน"] },
  { id: "P12", level: 3, stage: 3, mode: "describe", text: "ห้องสมุด", description: "ที่ที่เรายืมหนังสือไปอ่านได้ มีหนังสือเยอะมาก", accept: ["ห้องสมุด"] },
  { id: "P13", level: 3, stage: 1, mode: "sentence", text: "รบกวนช่วยพาไปห้องน้ำหน่อย", accept: ["รบกวนช่วยพาไปห้องน้ำหน่อย"] },
  { id: "P14", level: 3, stage: 1, mode: "question", text: "ชอบกินข้าวกับอะไรคะ" },
  { id: "P15", level: 3, stage: 3, mode: "question", text: "เมื่อเช้ากินอะไรมาคะ" },
];

export type PlacementOutcome = { level: Level; seeDoctor: boolean };

/** กฎจาก placement-test.md: ผ่าน = ถูกโดยใช้คำใบ้ ≤1 ครั้ง */
export function scorePlacement(results: ItemResult[]): PlacementOutcome {
  const passed = new Set(results.filter((r) => r.status === "correct" && r.cues <= 1).map((r) => r.id));
  const count = (lv: Level) => PLACEMENT.filter((p) => p.level === lv && passed.has(p.id)).length;
  const level: Level = count(3) >= 3 ? 3 : count(2) >= 3 ? 2 : 1;
  const firstFive = PLACEMENT.slice(0, 5).filter((p) => passed.has(p.id)).length;
  return { level, seeDoctor: firstFive <= 1 };
}

/** ประมาณการจาก A8: ระดับละ ~5 สัปดาห์ */
export function estimateWeeks(level: Level): number {
  return (4 - level) * 5;
}
