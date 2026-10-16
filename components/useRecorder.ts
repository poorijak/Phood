"use client";
import { useRef, useState } from "react";

// โหมดในเครื่อง (ค่าเริ่มต้น): ใช้ Web Speech API ของเบราว์เซอร์ ไม่เรียก API ภายนอกของเรา
// ตั้ง NEXT_PUBLIC_LOCAL_MODE=false เพื่อใช้ MediaRecorder + ElevenLabs Scribe ผ่าน /api/transcribe
export const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE !== "false";

export type Captured = { blob?: Blob; text?: string };

type SR = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export function speechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const resolveStop = useRef<((c: Captured) => void) | null>(null);
  const sr = useRef<SR | null>(null);
  const srText = useRef("");
  const srEnded = useRef(false);
  const srError = useRef("");

  async function start() {
    if (LOCAL_MODE) {
      if (!speechRecognitionSupported()) throw new Error("no_speech_recognition");
      const w = window as unknown as Record<string, new () => SR>;
      const r = new (w.SpeechRecognition || w.webkitSpeechRecognition)();
      r.lang = "th-TH";
      r.continuous = true;
      r.interimResults = false;
      r.maxAlternatives = 1;
      srText.current = ""; srEnded.current = false; srError.current = "";
      r.onresult = (e) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        srText.current = t;
      };
      r.onerror = (e) => { srError.current = e.error; };
      r.onend = () => {
        srEnded.current = true;
        resolveStop.current?.({ text: srText.current.trim() });
        resolveStop.current = null;
      };
      r.start();
      sr.current = r;
      setRecording(true);
      return;
    }
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = pickMime();
    const r = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      resolveStop.current?.({ blob: new Blob(chunks.current, { type: r.mimeType || "audio/webm" }) });
    };
    r.start();
    rec.current = r;
    setRecording(true);
  }

  function stop(): Promise<Captured> {
    return new Promise((resolve) => {
      setRecording(false);
      if (LOCAL_MODE) {
        if (srEnded.current) return resolve({ text: srText.current.trim() });
        resolveStop.current = resolve;
        try { sr.current?.stop(); } catch { resolve({ text: srText.current.trim() }); }
        // กันเบราว์เซอร์ที่ไม่ยิง onend
        setTimeout(() => { resolveStop.current?.({ text: srText.current.trim() }); resolveStop.current = null; }, 2500);
        return;
      }
      resolveStop.current = resolve;
      rec.current?.stop();
    });
  }

  return { recording, start, stop, lastError: () => srError.current };
}
