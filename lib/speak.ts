// เล่นเสียง: ลองไฟล์ในเครื่องก่อน (public/audio) → /api/tts (ElevenLabs) → เสียงไทยของเบราว์เซอร์
let current: HTMLAudioElement | null = null;
const ttsCache = new Map<string, string>();

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

function playUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const a = new Audio(url);
    current = a;
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

export async function speak(text: string, opts: { id?: string } = {}): Promise<void> {
  if (!text.trim()) return;
  stopSpeaking();
  if (opts.id && (await playUrl(`/audio/${opts.id}.mp3`))) return;
  if (process.env.NEXT_PUBLIC_LOCAL_MODE === "false") try {
    let url = ttsCache.get(text);
    if (!url) {
      const res = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error("tts " + res.status);
      url = URL.createObjectURL(await res.blob());
      ttsCache.set(text, url);
    }
    if (await playUrl(url)) return;
  } catch {}
  await browserSpeak(text);
}

export function stopSpeaking() {
  try { current?.pause(); } catch {}
  current = null;
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
