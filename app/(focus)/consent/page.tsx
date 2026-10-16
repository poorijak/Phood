"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { installAudioUnlock, speak, stopSpeaking } from "@/lib/speak";
import { store } from "@/lib/store";

const TEXT = "แอปนี้ใช้ไมค์ฟังเสียงของคุณ เพื่อตรวจคำตอบ เราไม่เก็บไฟล์เสียงไว้ ถ้าตกลง กดปุ่มสีน้ำเงิน";

export default function Consent() {
  const router = useRouter();
  useEffect(() => { if (!store.getUser()) router.replace("/"); }, [router]);
  useEffect(() => { installAudioUnlock(); return () => stopSpeaking(); }, []);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-6">
      <div className="space-y-6 text-center">
        <div className="text-8xl">🎤</div>
        <h1 className="text-3xl font-bold">ก่อนเริ่ม</h1>
        <p className="text-2xl leading-relaxed">แอปจะใช้<strong>ไมค์</strong>ฟังเสียงของคุณ<br />เพื่อตรวจคำตอบ</p>
        <p className="text-xl text-sub">เราไม่เก็บไฟล์เสียงไว้</p>
        <button className="btn btn-ghost !w-auto mx-auto px-6" onClick={() => speak(TEXT)}>🔊 ฟังเสียงอ่าน</button>
      </div>
      <div className="space-y-3">
        <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.6rem" }} onClick={() => { store.setConsent(); router.push("/placement"); }}>
          ✅ ตกลง
        </button>
        <button className="btn btn-line" onClick={() => router.push("/")}>กลับ</button>
      </div>
    </div>
  );
}
