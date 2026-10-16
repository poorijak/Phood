"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Runner from "@/components/Runner";
import { PLACEMENT, scorePlacement } from "@/lib/placement";
import { store } from "@/lib/store";
import type { ItemResult } from "@/lib/types";

export default function Placement() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!store.getUser()) return router.replace("/");
    if (!store.hasConsent()) return router.replace("/consent");
    setOk(true);
  }, [router]);

  if (!ok) return null;

  function finish(results: ItemResult[]) {
    const out = scorePlacement(results);
    const passed = results.filter((r) => r.status === "correct" && r.cues <= 1).length;
    const p = store.getProgress();
    store.setProgress({ ...p, level: out.level, stage: 1, failStreak: 0, completed: false, placed: true });
    try { sessionStorage.setItem("aphasia.placement", JSON.stringify({ ...out, passed, total: PLACEMENT.length })); } catch {}
    router.push("/result");
  }

  return <Runner items={PLACEMENT} stopAfterWrong={3} onFinish={finish} label="แบบทดสอบ" />;
}
