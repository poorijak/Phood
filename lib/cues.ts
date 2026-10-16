import type { Item } from "./types";

export type Cue = { text: string; speak?: string; model?: boolean };

function firstSound(word: string): string {
  const m = word.match(/^[เแโใไ]?([ก-ฮ][ะาิีึืุูั็่้๊๋์]*)/);
  return m ? m[1] : word.slice(0, 1);
}

/** คำใบ้ 3 ขั้น (A5): ความหมาย → เสียงต้น → ฟังคำเต็มแล้วพูดตาม */
export function cuesFor(item: Item): [Cue, Cue, Cue] {
  const full: Cue = { text: `ฟังแล้วพูดตาม: "${item.text}"`, speak: item.text, model: true };
  switch (item.mode) {
    case "picture":
      return [
        { text: "นึกถึงตอนที่เราเห็นหรือใช้สิ่งนี้ที่บ้าน", speak: "นึกถึงตอนที่เราเห็นหรือใช้สิ่งนี้ที่บ้านนะ" },
        { text: `เริ่มด้วยเสียง "${firstSound(item.text)}…"`, speak: firstSound(item.text) },
        full,
      ];
    case "describe":
      return [
        { text: "ลองนึกภาพของสิ่งนั้นในใจ แล้วฟังคำใบ้อีกครั้ง", speak: item.description },
        { text: `เริ่มด้วยเสียง "${firstSound(item.text)}…"`, speak: firstSound(item.text) },
        full,
      ];
    case "sentence": {
      const half = item.text.slice(0, Math.max(2, Math.ceil(item.text.length / 2)));
      return [
        { text: "ฟังประโยคอีกครั้งช้าๆ", speak: item.text },
        { text: `เริ่มด้วย "${half}…"`, speak: half },
        full,
      ];
    }
    case "question":
      return [
        { text: "ตอบสั้นๆ แค่คำเดียวก็ได้", speak: "ตอบสั้นๆ แค่คำเดียวก็ได้นะ" },
        { text: "ไม่มีคำตอบผิด เล่าเท่าที่นึกออกได้เลย", speak: "ไม่มีคำตอบผิด เล่าเท่าที่นึกออกได้เลยนะ" },
        { text: "ฟังคำถามอีกครั้ง แล้วตอบตามที่นึกออก", speak: item.text },
      ];
  }
}

/** เสียงที่แอปพูดเมื่อแสดงข้อ */
export function promptSpeech(item: Item): string {
  switch (item.mode) {
    case "picture": return "นี่คืออะไร";
    case "describe": return item.description ?? "";
    case "sentence": return `พูดตามนะ ${item.text}`;
    case "question": return item.text;
  }
}
