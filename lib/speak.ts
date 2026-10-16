// เล่นเสียง: ไฟล์ในเครื่อง (public/audio/<id>.mp3) → /api/tts (Gemini/ElevenLabs) → เสียงไทยของเบราว์เซอร์
// ใช้ Web Audio API (ปลดล็อกตอนผู้ใช้แตะครั้งแรก) เพราะ Safari บล็อก audio.play() ที่เกิดหลังรอ fetch
let ctx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
const bufferCache = new Map<string, AudioBuffer>();
let ttsBlockedUntil = 0; // 503 = ไม่มี key → ปิดถาวร · error อื่น → พัก 60 วินาที

export type SpeakSource = "file" | "api" | "browser" | "none";
export let lastSource: SpeakSource = "none";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** เรียกครั้งเดียว: ปลดล็อกเสียงเมื่อผู้ใช้แตะหน้าจอครั้งแรก */
export function installAudioUnlock() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    const c = getCtx();
    if (!c) return;
    void c.resume();
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  };
  window.addEventListener("pointerdown", unlock, { once: true, capture: true });
  window.addEventListener("keydown", unlock, { once: true, capture: true });
}

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";
    const v = speechSynthesis.getVoices().find((x) => x.lang.replace("_", "-").toLowerCase().startsWith("th"));
    if (v) u.voice = v;
    u.rate = 0.85;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

async function playBuffer(buf: AudioBuffer): Promise<boolean> {
  const c = getCtx();
  if (!c) return false;
  if (c.state !== "running") await c.resume().catch(() => {});
  if (c.state !== "running") return false; // ยังไม่ถูกปลดล็อก
  return new Promise((resolve) => {
    const s = c.createBufferSource();
    s.buffer = buf;
    s.connect(c.destination);
    s.onended = () => resolve(true);
    currentSource = s;
    s.start(0);
  });
}

async function decode(data: ArrayBuffer): Promise<AudioBuffer | null> {
  const c = getCtx();
  if (!c) return null;
  try { return await c.decodeAudioData(data); } catch { return null; }
}

/** ชื่อไฟล์เสียงล่วงหน้า = sha1(ข้อความ) 16 ตัวแรก (สร้างด้วย scripts/gen-audio.mjs) */
async function fileName(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadFile(text: string): Promise<AudioBuffer | null> {
  const key = `file:${text}`;
  const hit = bufferCache.get(key);
  if (hit) return hit;
  try {
    const r = await fetch(`/audio/${await fileName(text)}.wav`);
    if (!r.ok) return null;
    const b = await decode(await r.arrayBuffer());
    if (b) bufferCache.set(key, b);
    return b;
  } catch { return null; }
}

async function loadTts(text: string): Promise<AudioBuffer | null> {
  const key = `tts:${text}`;
  const hit = bufferCache.get(key);
  if (hit) return hit;
  if (Date.now() < ttsBlockedUntil) return null;
  try {
    const r = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    if (!r.ok) {
      ttsBlockedUntil = r.status === 503 ? Infinity : Date.now() + (r.status === 429 ? 10 * 60_000 : 60_000);
      console.warn("[speak] /api/tts", r.status);
      return null;
    }
    const b = await decode(await r.arrayBuffer());
    if (b) bufferCache.set(key, b);
    else console.warn("[speak] ถอดรหัสเสียงจาก /api/tts ไม่ได้");
    return b;
  } catch (e) {
    ttsBlockedUntil = Date.now() + 60_000;
    console.warn("[speak] /api/tts error", e);
    return null;
  }
}

export async function speak(text: string, _opts: { id?: string } = {}): Promise<void> {
  if (!text.trim()) return;
  stopSpeaking();
  const fromFile = await loadFile(text);
  if (fromFile && (await playBuffer(fromFile))) { lastSource = "file"; return; }
  const fromApi = await loadTts(text);
  if (fromApi && (await playBuffer(fromApi))) { lastSource = "api"; return; }
  if (fromApi) console.warn("[speak] เสียงจาก API ยังเล่นไม่ได้ (เบราว์เซอร์ยังไม่ปลดล็อกเสียง) — แตะหน้าจอหนึ่งครั้งแล้วลองใหม่");
  lastSource = "browser";
  await browserSpeak(text);
}

export function stopSpeaking() {
  try { currentSource?.stop(); } catch {}
  currentSource = null;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** ตรวจว่าเบราว์เซอร์นี้พูดไทยได้ไหม (ใช้แสดงคำเตือน) */
export function speechSupport(): { ok: boolean; reason?: string } {
  if (typeof speechSynthesis === "undefined") return { ok: false, reason: "เบราว์เซอร์นี้ไม่มีเสียงพูด ให้เปิดแอปใน Safari หรือ Chrome" };
  const voices = speechSynthesis.getVoices();
  if (voices.length && !voices.some((x) => x.lang.toLowerCase().startsWith("th"))) {
    return { ok: false, reason: "เครื่องนี้ยังไม่มีเสียงภาษาไทย (ติดตั้งได้ที่ การตั้งค่าระบบ → การช่วยการเข้าถึง → เนื้อหาที่พูด)" };
  }
  return { ok: true };
}
