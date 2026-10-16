"use client";
import { useEffect, useRef, useState } from "react";
import { cuesFor, promptSpeech } from "@/lib/cues";
import { MODE_LABEL } from "@/lib/content";
import { installAudioUnlock, speak, speechSupport, stopSpeaking } from "@/lib/speak";
import type { Item, ItemResult, ItemStatus } from "@/lib/types";
import { LOCAL_MODE, speechRecognitionSupported, useRecorder } from "./useRecorder";

type Fb = { tone: "ok" | "warn" | "info"; text: string };
type Turn = { role: "coach" | "user"; text: string };

const PRAISE = ["เก่งมาก!", "ถูกต้อง เยี่ยมเลย!", "ดีมากเลย!", "สุดยอด!"];
const MAX_ATTEMPTS = 3; // ครั้งแรก + ลองใหม่ได้ 2 ครั้ง

export default function Runner({
  items,
  stopAfterWrong,
  onFinish,
  label,
}: {
  items: Item[];
  stopAfterWrong?: number;
  onFinish: (results: ItemResult[]) => void;
  label: string;
}) {
  const { recording, start, stop } = useRecorder();
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [cueLevel, setCueLevel] = useState(0);
  const [cueText, setCueText] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [selfReport, setSelfReport] = useState(false);
  const [done, setDone] = useState<ItemStatus | null>(null); // ข้อนี้จบแล้ว รอกดข้อต่อไป
  const [chat, setChat] = useState<Turn[]>([]);
  const [chatRounds, setChatRounds] = useState(0);
  const [micError, setMicError] = useState("");
  const [heard, setHeard] = useState("");
  const [env, setEnv] = useState<string[]>([]);
  const resultsRef = useRef<ItemResult[]>([]);

  const item = items[idx];

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCueLevel(0); setCueText(""); setAttempts(0); setBusy(false); setFb(null);
    setSelfReport(false); setDone(null); setChat([]); setChatRounds(0); setMicError(""); setHeard("");
    /* eslint-enable react-hooks/set-state-in-effect */
    if (item) void speak(promptSpeech(item), { id: item.id });
    return () => stopSpeaking();
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    installAudioUnlock();
    const t = setTimeout(async () => {
      const w: string[] = [];
      const sp = speechSupport();
      if (!sp.ok && sp.reason) w.push(sp.reason);
      if (LOCAL_MODE && !speechRecognitionSupported()) w.push("เบราว์เซอร์นี้ฟังเสียงพูดไม่ได้ ให้เปิดแอปใน Safari หรือ Chrome ปกติ (ไม่ใช่หน้าต่างพรีวิวในแอป)");
      try {
        const st = await navigator.permissions?.query({ name: "microphone" as PermissionName });
        if (st?.state === "denied") w.push("ไมค์ถูกบล็อก: กดไอคอนแม่กุญแจข้างช่องที่อยู่เว็บ แล้วเปิด “ไมโครโฟน” จากนั้นรีเฟรชหน้า");
      } catch {}
      setEnv(w);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  if (!item) return null;

  function complete(status: ItemStatus, cues = cueLevel, att = attempts + 1) {
    const r: ItemResult = { id: item.id, status, cues, attempts: att };
    resultsRef.current = [...resultsRef.current, r];
    setResults(resultsRef.current);
    setDone(status);
    setSelfReport(false);
    if (status === "correct") {
      const msg = PRAISE[idx % PRAISE.length];
      setFb({ tone: "ok", text: msg });
      void speak(msg);
    } else if (status === "practiced") {
      setFb({ tone: "info", text: "ดีมาก ได้ฝึกข้อนี้แล้ว เดี๋ยวเรากลับมาลองอีกครั้งนะ" });
    } else if (status === "skipped") {
      setFb({ tone: "info", text: "ไม่เป็นไร ข้ามข้อนี้ก่อนนะ" });
    } else {
      setFb({ tone: "info", text: "ไม่เป็นไรนะ ไปข้อต่อไปกัน" });
    }
  }

  function next() {
    const all = resultsRef.current;
    if (stopAfterWrong) {
      let streak = 0;
      for (let i = all.length - 1; i >= 0 && all[i].status !== "correct"; i--) streak++;
      if (streak >= stopAfterWrong) return onFinish(all);
    }
    if (idx + 1 >= items.length) return onFinish(all);
    setIdx(idx + 1);
  }

  function failedAttempt(kind: "incorrect" | "unsure") {
    const a = attempts + 1;
    setAttempts(a);
    if (a >= MAX_ATTEMPTS) {
      if (kind === "incorrect") return complete("wrong", cueLevel, a);
      setFb({ tone: "warn", text: "ฟังไม่ค่อยชัดเลย ถ้าเมื่อกี้พูดได้แล้ว กดปุ่ม “ฉันตอบได้” ได้เลย" });
      return setSelfReport(true);
    }
    const msg = kind === "incorrect" ? "ลองอีกครั้งนะ" : "ฟังไม่ค่อยชัด ลองพูดอีกครั้งนะ";
    setFb({ tone: "warn", text: msg });
    void speak(msg);
  }

  async function onMic() {
    setMicError("");
    if (busy || done) return;
    if (!recording) {
      stopSpeaking();
      if (LOCAL_MODE && !speechRecognitionSupported()) {
        setMicError("เบราว์เซอร์นี้ไม่รองรับการฟังเสียง ใช้ Chrome หรือ Safari แล้วลองใหม่ (หรือกด “ข้ามข้อนี้”)");
        return;
      }
      try { await start(); } catch { setMicError("เปิดไมค์ไม่ได้ กรุณาอนุญาตการใช้ไมค์ในเบราว์เซอร์"); }
      return;
    }
    const cap = await stop();
    setBusy(true);
    setFb(null);
    try {
      // ขั้น 3 ของคำใบ้ = พูดตาม: ไม่ตัดสิน นับว่าได้ฝึก
      if (cueLevel >= 3) return complete("practiced", 3, attempts + 1);

      let text = cap.text ?? "";
      if (!LOCAL_MODE) {
        const fd = new FormData();
        fd.append("audio", cap.blob!, "speech.webm");
        const tr = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!tr.ok) throw new Error("transcribe");
        text = ((await tr.json()) as { text: string }).text;
      }
      setHeard(text);

      if (item.mode === "question") {
        const round = chatRounds + 1;
        const history = chat;
        const r = await fetch("/api/chat", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ question: item.text, transcript: text, history, round }),
        });
        const c = (await r.json()) as { relevant: boolean; reply: string };
        if (!c.relevant && round === 1) return failedAttempt(text.trim() ? "incorrect" : "unsure");
        setChat([...history, { role: "user", text }, { role: "coach", text: c.reply }]);
        setChatRounds(round);
        setFb({ tone: "ok", text: c.reply });
        if (round === 1) {
          resultsRef.current = [...resultsRef.current]; // ตัดสินตอนกด “ข้อต่อไป”
          void speak(c.reply);
        } else {
          complete("correct", cueLevel, attempts + 1);
          setFb({ tone: "ok", text: c.reply });
          void speak(c.reply);
        }
        return;
      }

      const jr = await fetch("/api/judge", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ item: { mode: item.mode, text: item.text, description: item.description, accept: item.accept }, transcript: text }),
      });
      const { verdict } = (await jr.json()) as { verdict: "correct" | "incorrect" | "unsure" };
      if (verdict === "correct") complete("correct");
      else failedAttempt(verdict);
    } catch {
      failedAttempt("unsure");
    } finally {
      setBusy(false);
    }
  }

  function askCue() {
    const lv = Math.min(3, cueLevel + 1);
    setCueLevel(lv);
    const c = cuesFor(item)[lv - 1];
    setCueText(c.text);
    setFb(null);
    if (c.speak) void speak(c.speak);
  }

  const chatWaiting = item.mode === "question" && chatRounds === 1 && !done;
  const finishChatNow = () => complete("correct", cueLevel, attempts + 1);
  const pct = Math.round((idx / items.length) * 100);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {env.length > 0 && (
        <div className="rounded-2xl border-2 border-warm bg-orange-50 p-3 text-base">
          {env.map((m) => <p key={m}>⚠️ {m}</p>)}
        </div>
      )}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-sub">
          <span>{label}</span>
          <span>ข้อ {idx + 1} / {items.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-soft">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card flex flex-1 flex-col items-center justify-center gap-4 p-5 text-center">
        <span className="rounded-full bg-soft px-3 py-1 text-sm font-medium text-link">{MODE_LABEL[item.mode]}</span>

        {item.mode === "picture" && <div className="text-[8rem] leading-none" aria-label="รูปภาพ">{item.emoji}</div>}
        {item.mode === "describe" && (
          <>
            <div className="text-7xl">🤔</div>
            <p className="text-2xl font-semibold">{item.description}</p>
          </>
        )}
        {item.mode === "sentence" && <p className="text-4xl font-bold leading-snug">{item.text}</p>}
        {item.mode === "question" && (
          <>
            <div className="text-7xl">💬</div>
            <p className="text-3xl font-bold leading-snug">{item.text}</p>
          </>
        )}

        <button className="btn btn-ghost !w-auto !min-h-[52px] px-5" onClick={() => speak(promptSpeech(item), { id: item.id })}>
          🔊 ฟังอีกครั้ง
        </button>

        {chat.length > 0 && (
          <div className="w-full space-y-2 text-left text-lg">
            {chat.map((t, i) => (
              <p key={i} className={t.role === "coach" ? "rounded-2xl bg-soft p-3 text-link" : "rounded-2xl border border-line p-3 text-sub"}>
                {t.role === "coach" ? "🧑‍⚕️ " : "🙂 "}{t.text}
              </p>
            ))}
          </div>
        )}

        {cueText && <p className="w-full rounded-2xl bg-soft p-3 text-xl font-semibold text-link">💡 {cueText}</p>}
        {fb && !chat.length && (
          <p className={`w-full rounded-2xl p-3 text-xl font-semibold ${fb.tone === "ok" ? "bg-green-50 text-ok" : fb.tone === "warn" ? "bg-orange-50 text-orange-600" : "bg-soft text-link"}`}>
            {fb.text}
          </p>
        )}
        {micError && <p className="text-base text-orange-600">{micError}</p>}
        {heard && !done && <p className="text-sm text-muted">ได้ยินว่า: “{heard}”</p>}
      </div>

      <div className="space-y-3">
        {!done && !selfReport && !chatWaiting && (
          <>
            <button
              onClick={onMic}
              disabled={busy}
              className={`btn ${recording ? "btn-primary recording !bg-warm" : "btn-primary"}`}
              style={{ minHeight: 84, fontSize: "1.5rem" }}
            >
              {busy ? "กำลังฟัง…" : recording ? "⏹ กดเมื่อพูดจบ" : cueLevel >= 3 ? "🎤 กดแล้วพูดตาม" : "🎤 กดแล้วพูด"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn btn-ghost" disabled={busy || recording || cueLevel >= 3} onClick={askCue}>
                💡 ขอคำใบ้{cueLevel > 0 ? ` (${cueLevel}/3)` : ""}
              </button>
              <button className="btn btn-line" disabled={busy || recording} onClick={() => complete("skipped")}>
                ข้ามข้อนี้
              </button>
            </div>
          </>
        )}

        {selfReport && (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-primary" onClick={() => complete("correct")}>✅ ฉันตอบได้</button>
            <button className="btn btn-line" onClick={() => complete("skipped")}>ข้ามข้อนี้</button>
          </div>
        )}

        {chatWaiting && (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-primary" onClick={onMic} disabled={busy}>
              {recording ? "⏹ พูดจบแล้ว" : "🎤 ตอบต่อ"}
            </button>
            <button className="btn btn-line" disabled={busy || recording} onClick={finishChatNow}>พอแล้ว</button>
          </div>
        )}

        {done && (
          <button className="btn btn-primary" style={{ minHeight: 76 }} onClick={next}>
            {idx + 1 >= items.length ? "จบแล้ว ดูผล →" : "ข้อต่อไป →"}
          </button>
        )}
      </div>
    </div>
  );
}
