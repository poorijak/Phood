import { ask, hasClaude, JUDGE_MODEL, parseJson } from "@/lib/claude";
import { exactMatch, normalize, similarity, stripFillers } from "@/lib/normalize";

type Body = {
  item: { mode: "picture" | "describe" | "sentence" | "question"; text: string; description?: string; accept?: string[] };
  transcript: string;
};
type Verdict = "correct" | "incorrect" | "unsure";

// ตัดสินคำตอบ: accept list ก่อน (ไม่เรียก AI) → ความคล้าย (ประโยค) → Claude Haiku
export async function POST(req: Request) {
  const { item, transcript } = (await req.json()) as Body;
  const t = (transcript ?? "").trim();
  if (normalize(t).length === 0) return Response.json({ verdict: "unsure" satisfies Verdict, via: "empty" });

  const accept = item.accept ?? [item.text];

  if (item.mode === "picture" || item.mode === "describe") {
    if (exactMatch(t, accept)) return Response.json({ verdict: "correct", via: "exact" });
  }
  if (item.mode === "sentence") {
    const sim = similarity(stripFillers(t), stripFillers(item.text));
    if (exactMatch(t, [item.text]) || sim >= 0.78) return Response.json({ verdict: "correct", via: "similarity", sim });
    if (!hasClaude()) return Response.json({ verdict: sim >= 0.5 ? "unsure" : "incorrect", via: "similarity", sim });
  }
  if (!hasClaude()) {
    // ไม่มี AI: ยอมรับเสียงที่ใกล้เคียง เพราะตัวถอดเสียงในเครื่องอาจเพี้ยน
    if (item.mode !== "question") {
      const best = Math.max(...accept.map((a) => similarity(stripFillers(t), stripFillers(a))));
      if (best >= 0.7) return Response.json({ verdict: "correct", via: "fuzzy", sim: best });
      return Response.json({ verdict: best >= 0.4 ? "unsure" : "incorrect", via: "no_ai", sim: best });
    }
    if (item.mode === "question") return Response.json({ verdict: normalize(t).length >= 2 ? "correct" : "unsure", via: "no_ai" });
    return Response.json({ verdict: "incorrect", via: "no_ai" });
  }

  const system =
    "คุณเป็นผู้ช่วยตรวจคำตอบในแอปฝึกพูดสำหรับผู้ป่วยภาษาบกพร่องหลังโรคหลอดเลือดสมอง " +
    "ข้อความที่ได้มาจากการถอดเสียงอัตโนมัติ อาจผิดเพี้ยนจากเสียงพูดที่ไม่ชัด ให้ใจดีและตัดสินจากความใกล้เคียงของเสียงและความหมาย " +
    'ตอบเป็น JSON บรรทัดเดียวเท่านั้น: {"verdict":"correct|incorrect|unsure"}';
  let task: string;
  if (item.mode === "picture") task = `โจทย์: ดูรูปแล้วเรียกชื่อ คำตอบที่ถูก: ${accept.join(" / ")}`;
  else if (item.mode === "describe") task = `โจทย์: ฟังคำใบ้ "${item.description}" แล้วบอกชื่อ คำตอบที่ถูก: ${accept.join(" / ")} (คำพ้องความหมายที่ตรงกับคำใบ้ก็ถือว่าถูก)`;
  else if (item.mode === "sentence") task = `โจทย์: พูดตามประโยค "${item.text}" ถือว่าถูกถ้าพูดคำสำคัญครบ คำท้ายประโยคเช่น หน่อย นะ ด้วย ไม่นับ`;
  else task = `โจทย์: ผู้ฝึกตอบคำถามอิสระ "${item.text}" ถือว่าถูกถ้าคำตอบเกี่ยวข้องกับคำถาม (ไม่ต้องสมบูรณ์)`;

  try {
    const out = await ask(JUDGE_MODEL, system, `${task}\nข้อความที่ถอดได้: "${t}"`, 60);
    const v = parseJson<{ verdict?: Verdict }>(out)?.verdict;
    if (v === "correct" || v === "incorrect" || v === "unsure") return Response.json({ verdict: v, via: "ai" });
  } catch {}
  return Response.json({ verdict: "unsure", via: "ai_error" });
}
