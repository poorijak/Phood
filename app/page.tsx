"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import GoogleLogin from "@/components/GoogleLogin";
import { store, type User } from "@/lib/store";
import type { Progress } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUser(store.getUser());
    setProgress(store.getProgress());
    setLoaded(true);
  }, []);

  const onUser = useCallback((u: User) => { store.setUser(u); setUser(u); }, []);

  if (!loaded) return null;
  const start = () => router.push(!store.hasConsent() ? "/consent" : progress?.placed ? "/practice" : "/placement");

  return (
    <div className="flex flex-1 flex-col justify-between gap-8">
      <header className="pt-6 text-center">
        <div className="text-7xl">🗣️</div>
        <h1 className="mt-3 text-4xl font-bold text-navy">Aphasia AI</h1>
        <p className="mt-2 text-xl text-sub">โค้ชฝึกพูดที่บ้าน ฝึกด้วยตัวเอง ทีละด่าน</p>
      </header>

      <section className="space-y-4">
        {!user ? (
          <GoogleLogin onUser={onUser} />
        ) : (
          <>
            <div className="card flex items-center gap-3 p-4">
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.picture} alt="" className="h-12 w-12 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-4xl">🙂</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold">สวัสดี {user.name}</p>
                {progress?.placed && (
                  <p className="text-base text-sub">ระดับ {progress.level} · ด่าน {progress.stage} / 5</p>
                )}
              </div>
            </div>
            <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.5rem" }} onClick={start}>
              {progress?.placed ? "▶ ฝึกต่อ" : "▶ เริ่มทดสอบ"}
            </button>
            {progress?.placed && (
              <button className="btn btn-line" onClick={() => router.push("/placement")}>ทำแบบทดสอบใหม่</button>
            )}
            <button
              className="mx-auto block text-base text-muted underline"
              onClick={() => { store.setUser(null); store.reset(); setUser(null); setProgress(store.getProgress()); }}
            >
              ออกจากระบบ
            </button>
          </>
        )}
      </section>

      <footer className="pb-2 text-center text-sm text-muted">
        แอปนี้ช่วยฝึกภาษา ไม่ใช่การวินิจฉัยหรือรักษาโรค
      </footer>
    </div>
  );
}
