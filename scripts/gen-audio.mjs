// สร้างไฟล์เสียงล่วงหน้าด้วย Gemini TTS → public/audio/<sha1-16>.wav (แอปเล่นไฟล์ก่อนเสมอ ไม่เสียโควตา)
// รัน: node scripts/gen-audio.mjs            (ข้ามไฟล์ที่มีแล้ว หยุดเองเมื่อโควตาวันนี้หมด รันซ้ำพรุ่งนี้ต่อได้)
//      node scripts/gen-audio.mjs --max 30   (จำกัดจำนวนต่อรอบ)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/audio");
fs.mkdirSync(outDir, { recursive: true });

const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().split(/\s+/)[0]]; }),
);
const KEY = env.GEMINI_API_KEY;
if (!KEY) { console.error("ไม่พบ GEMINI_API_KEY ใน .env.local"); process.exit(1); }
const MODEL = env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const VOICE = env.GEMINI_TTS_VOICE || "Kore";
const max = Number(process.argv[process.argv.indexOf("--max") + 1]) || Infinity;

const INSTRUCTION = "Read aloud in Thai, slowly and clearly, exactly this text: ";
const hash = (t) => crypto.createHash("sha1").update(t, "utf8").digest("hex").slice(0, 16);

// ---- รวบรวมข้อความที่แอปพูดตอนแสดงข้อ (ตรงกับ promptSpeech ใน lib/cues.ts) ----
const speech = (it) =>
  it.mode === "picture" ? "นี่คืออะไร" : it.mode === "describe" ? it.description : it.mode === "sentence" ? `พูดตามนะ ${it.text}` : it.text;

const phrases = ["เก่งมาก!", "ถูกต้อง เยี่ยมเลย!", "ดีมากเลย!", "สุดยอด!", "ลองอีกครั้งนะ", "ฟังไม่ค่อยชัด ลองพูดอีกครั้งนะ",
  "แอปนี้ใช้ไมค์ฟังเสียงของคุณ เพื่อตรวจคำตอบ เราไม่เก็บไฟล์เสียงไว้ ถ้าตกลง กดปุ่มสีน้ำเงิน"];

const placementSrc = fs.readFileSync(path.join(root, "lib/placement.ts"), "utf8");
const placement = [...placementSrc.matchAll(/mode: "(\w+)", text: "([^"]+)"(?:, emoji: "[^"]+")?(?:, description: "([^"]+)")?/g)]
  .map((m) => ({ mode: m[1], text: m[2], description: m[3] }));

const genSrc = fs.readFileSync(path.join(root, "lib/content.generated.ts"), "utf8");
const items = JSON.parse(genSrc.slice(genSrc.indexOf("= [") + 2).replace(/;\s*$/, ""));

const ordered = [
  ...phrases,
  ...placement.map(speech),
  ...items.filter((i) => i.level === 1 && i.stage === 1).map(speech),
  ...items.map(speech),
].filter(Boolean);
const texts = [...new Set(ordered)];

function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const todo = texts.filter((t) => !fs.existsSync(path.join(outDir, `${hash(t)}.wav`)));
console.log(`ข้อความทั้งหมด ${texts.length} · มีไฟล์แล้ว ${texts.length - todo.length} · ต้องสร้าง ${todo.length}`);

let made = 0;
async function synth(t) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: INSTRUCTION + t }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
    }),
  });
}
let stop = false;
for (const t of todo) {
  if (made >= max || stop) break;
  let res;
  for (let attempt = 0; attempt < 6; attempt++) {
    res = await synth(t);
    if (res.status !== 429) break;
    const body = JSON.stringify(await res.json().catch(() => ({})));
    if (/PerDay/.test(body)) { console.log("โควตารายวันหมด — หยุด (รันซ้ำพรุ่งนี้เพื่อทำต่อ)"); stop = true; break; }
    console.log("ชนขีดจำกัดต่อนาที รอ 65 วินาที…");
    await new Promise((r) => setTimeout(r, 65000));
  }
  if (stop) break;
  if (!res.ok) { console.log(`ข้าม "${t.slice(0, 20)}…" (${res.status})`); continue; }
  const data = await res.json();
  const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline) { console.log(`ไม่มีเสียงสำหรับ "${t.slice(0, 20)}…"`); continue; }
  const raw = Buffer.from(inline.data, "base64");
  const rate = Number(inline.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000);
  fs.writeFileSync(path.join(outDir, `${hash(t)}.wav`), inline.mimeType?.includes("wav") ? raw : wav(raw, rate));
  made++;
  console.log(`✓ ${made}  ${t.slice(0, 40)}`);
  await new Promise((r) => setTimeout(r, 7000));
}
console.log(`สร้างใหม่ ${made} ไฟล์ · เหลือ ${todo.length - made}`);
