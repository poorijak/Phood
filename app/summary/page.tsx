"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type S = {
  outcome: "advance" | "levelup" | "finished" | "retry" | "demote";
  pct: number; level: number; stage: number; toLevel: number; toStage: number;
  total: number; skipped: number; correct: number; practiced: number;
};

const COPY: Record<S["outcome"], { emoji: string; title: string; body: (s: S) => string; cta: (s: S) => string }> = {
  advance: { emoji: "🌟", title: "ผ่านด่านแล้ว!", body: (s) => `เก่งมาก ด่านต่อไปคือด่าน ${s.toStage}`, cta: (s) => `ไปด่าน ${s.toStage} →` },
  levelup: { emoji: "🏆", title: "ขึ้นระดับแล้ว!", body: (s) => `ยินดีด้วย เรากำลังไประดับ ${s.toLevel}`, cta: (s) => `ไประดับ ${s.toLevel} →` },
  finished: { emoji: "🎓", title: "จบครบทุกระดับแล้ว!", body: () => "ทำได้ยอดเยี่ยมมาก ทบทวนด่านเดิมต่อได้ตลอดนะ", cta: () => "ฝึกทบทวน →" },
  retry: { emoji: "💪", title: "เกือบแล้ว!", body: () => "ลองทำด่านนี้อีกครั้งนะ ค่อยๆ ไป ฝึกบ่อยๆ จะดีขึ้น", cta: () => "ลองอีกครั้ง →" },
  demote: { emoji: "🌱", title: "กลับไปทบทวนก่อนนะ", body: (s) => `เราจะพากลับไปด่านที่ง่ายกว่า (ระดับ ${s.toLevel} ด่าน ${s.toStage}) เพื่อฝึกให้มั่นใจ`, cta: () => "ไปทบทวน →" },
};

export default function Summary() {
  const router = useRouter();
  const [s, setS] = useState<S | null>(null);
  useEffect(() => {
    try { setS(JSON.parse(sessionStorage.getItem("aphasia.stage") ?? "null")); } catch {}
  }, []);
  useEffect(() => { if (s === null && typeof window !== "undefined") { /* รอโหลด */ } }, [s]);
  if (!s) return null;
  const c = COPY[s.outcome];
  const skippedMany = s.total > 0 && s.skipped / s.total > 0.3;

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-4">
      <div className="space-y-5 text-center">
        <div className="text-7xl">{c.emoji}</div>
        <h1 className="text-3xl font-bold">{c.title}</h1>
        <div className="card p-5">
          <p className="text-6xl font-bold text-brand">{Math.round(s.pct * 100)}%</p>
          <p className="text-lg text-sub">ตอบได้ {s.correct} จาก {s.total - s.skipped} ข้อ{s.skipped ? ` (ข้าม ${s.skipped} ข้อ ไม่นับคะแนน)` : ""}</p>
          {s.practiced > 0 && <p className="text-base text-muted">ข้อที่ฝึกพูดตาม {s.practiced} ข้อ จะกลับมาทำอีก</p>}
        </div>
        <p className="text-xl leading-relaxed">{c.body(s)}</p>
        {skippedMany && (
          <p className="rounded-2xl bg-soft p-4 text-left text-lg text-link">
            ข้อนี้ข้ามค่อนข้างเยอะ ลองพูดใกล้ไมค์ขึ้นหรือหาที่เงียบๆ นะ ถ้ายังไม่ดีขึ้น ลองปรึกษาผู้เชี่ยวชาญได้
          </p>
        )}
      </div>
      <div className="space-y-3">
        <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.5rem" }} onClick={() => router.push("/practice")}>{c.cta(s)}</button>
        <button className="btn btn-line" onClick={() => router.push("/")}>พักก่อน</button>
      </div>
    </div>
  );
}
