"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { estimateWeeks } from "@/lib/placement";
import type { Level } from "@/lib/types";

type R = { level: Level; seeDoctor: boolean; passed: number; total: number };
const NAME = { 1: "เริ่มต้น", 2: "ปานกลาง", 3: "ก้าวหน้า" } as const;

export default function Result() {
  const router = useRouter();
  const [r, setR] = useState<R | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let data: R | null = null;
    try { data = JSON.parse(sessionStorage.getItem("aphasia.placement") ?? "null"); } catch {}
    if (!data) return router.replace("/");
    setR(data);
    fetch("/api/placement", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
      .then((x) => x.json()).then((j) => setMsg(j.message)).catch(() => {});
  }, [router]);

  if (!r) return null;
  const w = estimateWeeks(r.level);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-4">
      <div className="space-y-5 text-center">
        <div className="text-7xl">🎉</div>
        <h1 className="text-3xl font-bold">ทำแบบทดสอบเสร็จแล้ว</h1>
        <div className="card mx-auto w-full p-6">
          <p className="text-lg text-sub">เราจะเริ่มฝึกที่</p>
          <p className="text-6xl font-bold text-brand">ระดับ {r.level}</p>
          <p className="text-xl font-semibold text-link">{NAME[r.level]}</p>
        </div>
        {msg && <p className="text-xl leading-relaxed">{msg}</p>}
        <p className="rounded-2xl bg-soft p-4 text-lg text-link">
          ฝึกวันละ 1 ด่าน (10–20 นาที) ใช้เวลาโดยประมาณ <strong>{w} สัปดาห์</strong> จนจบทุกระดับ
        </p>
        {r.seeDoctor && (
          <p className="rounded-2xl border-2 border-warm bg-orange-50 p-4 text-left text-lg">
            🩺 ผลวันนี้ตอบได้น้อย แนะนำให้ปรึกษาแพทย์หรือนักแก้ไขการพูด เพื่อให้ได้คำแนะนำที่เหมาะกับคุณ แล้วค่อยฝึกกับแอปนี้ควบคู่กันได้
          </p>
        )}
      </div>
      <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.5rem" }} onClick={() => router.push("/practice")}>
        เริ่มฝึกด่าน 1 →
      </button>
    </div>
  );
}
