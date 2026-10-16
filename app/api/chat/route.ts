import { ask, CHAT_MODEL, hasClaude, parseJson } from "@/lib/claude";

type Body = {
  question: string;
  transcript: string;
  history?: { role: "coach" | "user"; text: string }[];
  round: number; // 1..2
};

// โหมดคุยกับโค้ช: ตัดสินว่าตอบเกี่ยวข้องไหม + ตอบกลับสั้นๆ แล้วถามต่อ (ไม่เกิน 2 รอบ)
export async function POST(req: Request) {
  const { question, transcript, history = [], round } = (await req.json()) as Body;
  const last = round >= 2;
  if (!hasClaude()) {
    return Response.json({ relevant: transcript.trim().length >= 2, reply: last ? "เก่งมากเลย วันนี้คุยกันได้ดีมาก" : "ขอบคุณที่เล่าให้ฟังนะ เล่าให้ฟังอีกหน่อยได้ไหม" });
  }
  const system =
    "คุณเป็นโค้ชฝึกพูดที่ใจดี คุยกับผู้ป่วยภาษาบกพร่องหลังโรคหลอดเลือดสมอง ใช้ประโยคสั้นมาก คำง่าย ไม่เกิน 2 ประโยค " +
    "ห้ามวินิจฉัย ห้ามแก้คำพูดที่ผิด ห้ามใช้คำว่า ผิด/ตก ให้กำลังใจเสมอ ไม่ใช้คำลงท้ายครับ/ค่ะ ใช้ 'นะ' ได้ " +
    "ข้อความผู้ฝึกมาจากการถอดเสียง อาจเพี้ยน ให้เดาความหมายอย่างใจกว้าง " +
    (last ? "นี่เป็นรอบสุดท้าย ให้ชมและปิดบทสนทนา ไม่ต้องถามต่อ " : "ให้ตอบรับสั้นๆ แล้วถามต่อ 1 คำถามที่ตอบง่าย ") +
    'ตอบเป็น JSON บรรทัดเดียว: {"relevant":true|false,"reply":"..."} โดย relevant = คำตอบเกี่ยวข้องกับคำถามไหม';
  const convo = history.map((h) => `${h.role === "coach" ? "โค้ช" : "ผู้ฝึก"}: ${h.text}`).join("\n");
  try {
    const out = await ask(CHAT_MODEL, system, `คำถามแรก: ${question}\n${convo}\nผู้ฝึกตอบล่าสุด: "${transcript}"`, 200);
    const j = parseJson<{ relevant?: boolean; reply?: string }>(out);
    if (j?.reply) return Response.json({ relevant: j.relevant !== false, reply: j.reply });
  } catch {}
  return Response.json({ relevant: transcript.trim().length >= 2, reply: "ขอบคุณที่เล่าให้ฟังนะ เก่งมากเลย" });
}
