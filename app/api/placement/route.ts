import { ask, CHAT_MODEL, hasClaude } from "@/lib/claude";

// ข้อความสรุปผลระดับการฝึก (ให้กำลังใจ ไม่วินิจฉัย) — ระดับตัดสินด้วยกฎใน lib/placement.ts
export async function POST(req: Request) {
  const { level, passed, total, seeDoctor } = (await req.json()) as { level: 1 | 2 | 3; passed: number; total: number; seeDoctor: boolean };
  const fallback =
    level === 1 ? "เราจะเริ่มจากแบบฝึกที่ง่ายและค่อยเป็นค่อยไป ทำทีละนิดทุกวันนะ"
    : level === 2 ? "คุณทำได้ดีหลายข้อ เราจะเริ่มจากแบบฝึกระดับกลาง ฝึกต่อเนื่องจะดีขึ้นเรื่อยๆ"
    : "คุณทำได้ดีมาก เราจะเริ่มจากแบบฝึกระดับที่ท้าทายขึ้นนิดหน่อย";
  if (!hasClaude()) return Response.json({ message: fallback });
  try {
    const system =
      "เขียนข้อความสรุปผลสั้นๆ 1–2 ประโยคเป็นภาษาไทย ให้กำลังใจผู้ป่วยที่กำลังฝึกพูด ห้ามวินิจฉัย ห้ามพูดถึงความรุนแรงของโรค ห้ามใช้คำว่าตก/ผิด ไม่ใช้ครับ/ค่ะ";
    const msg = await ask(CHAT_MODEL, system, `ผลแบบทดสอบ: ผ่าน ${passed} จาก ${total} ข้อ จัดอยู่ระดับการฝึก ${level} จาก 3${seeDoctor ? " (ไม่ต้องพูดถึงแพทย์ จะมีข้อความแยก)" : ""}`, 150);
    return Response.json({ message: msg.trim() || fallback });
  } catch {
    return Response.json({ message: fallback });
  }
}
