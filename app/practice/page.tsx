"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Runner from "@/components/Runner";
import { stageSession } from "@/lib/content";
import { applyStageResult } from "@/lib/rules";
import { store } from "@/lib/store";
import type { Item, ItemResult, Progress } from "@/lib/types";

export default function Practice() {
  const router = useRouter();
  const [state, setState] = useState<{ p: Progress; items: Item[] } | null>(null);

  useEffect(() => {
    if (!store.getUser()) return router.replace("/");
    if (!store.hasConsent()) return router.replace("/consent");
    const p = store.getProgress();
    if (!p.placed) return router.replace("/placement");
    setState({ p, items: stageSession(p.level, p.stage) });
  }, [router]);

  if (!state) return null;
  const { p, items } = state;

  function finish(results: ItemResult[]) {
    const { next, outcome, pct } = applyStageResult(p, results);
    store.setProgress(next);
    const skipped = results.filter((r) => r.status === "skipped").length;
    try {
      sessionStorage.setItem("aphasia.stage", JSON.stringify({
        outcome, pct, level: p.level, stage: p.stage, toLevel: next.level, toStage: next.stage,
        total: results.length, skipped, correct: results.filter((r) => r.status === "correct").length,
        practiced: results.filter((r) => r.status === "practiced").length,
      }));
    } catch {}
    router.push("/summary");
  }

  return <Runner key={`${p.level}-${p.stage}`} items={items} onFinish={finish} label={`ระดับ ${p.level} · ด่าน ${p.stage}`} />;
}
