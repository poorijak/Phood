"use client";
import { useEffect, useRef, useState } from "react";
import type { User } from "@/lib/store";

type GIS = {
  accounts: { id: { initialize: (c: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } };
};
declare global { interface Window { google?: GIS } }

function decodeJwt(token: string): Record<string, string> {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(payload))));
}

export default function GoogleLogin({ onUser }: { onUser: (u: User) => void }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const init = () => {
      if (!window.google || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r: { credential: string }) => {
          const p = decodeJwt(r.credential);
          onUser({ id: p.sub, name: p.name ?? p.email, email: p.email, picture: p.picture });
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", shape: "pill", text: "signin_with", width: 320, locale: "th" });
      setReady(true);
    };
    if (window.google) return init();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [clientId, onUser]);

  return (
    <div className="space-y-3">
      {clientId ? (
        <div className="flex min-h-[48px] justify-center">
          <div ref={box} />
          {!ready && <span className="text-sm text-muted">กำลังโหลดปุ่ม Google…</span>}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">(ยังไม่ได้ตั้งค่า Google login — ใช้โหมดทดลองด้านล่างได้)</p>
      )}
      <button className="btn btn-ghost" onClick={() => onUser({ id: "guest", name: "ผู้ทดลองใช้", guest: true })}>
        เริ่มโดยไม่ล็อกอิน (โหมดทดลอง)
      </button>
    </div>
  );
}
