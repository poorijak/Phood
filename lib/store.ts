// ที่เก็บข้อมูลฝั่งเบราว์เซอร์ (MVP) — เปลี่ยนเป็น Supabase ได้โดยแก้ไฟล์นี้ไฟล์เดียว (ดู supabase/schema.sql)
import { INITIAL } from "./rules";
import type { Progress } from "./types";

export type User = { id: string; name: string; email?: string; picture?: string; guest?: boolean };

const K_USER = "aphasia.user";
const K_PROGRESS = "aphasia.progress";
const K_CONSENT = "aphasia.consent";

function get<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function set(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export const store = {
  getUser: () => get<User>(K_USER),
  setUser: (u: User | null) => (u ? set(K_USER, u) : localStorage.removeItem(K_USER)),
  getProgress: (): Progress => ({ ...INITIAL, ...(get<Progress>(K_PROGRESS) ?? {}) }),
  setProgress: (p: Progress) => set(K_PROGRESS, p),
  hasConsent: () => get<boolean>(K_CONSENT) === true,
  setConsent: () => set(K_CONSENT, true),
  reset: () => { try { localStorage.removeItem(K_PROGRESS); } catch {} },
};
