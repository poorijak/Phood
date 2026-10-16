# Phood — เว็บแอปเดโม (Next.js)

โค้ชฝึกพูดที่บ้าน: แบบทดสอบ 15 ข้อ → จัดระดับ 1–3 → ฝึกทีละด่าน (คลัง 350 ข้อ) · แผนอยู่ที่ `../product/implementation-plan.md`

## รันในเครื่อง
```bash
cp .env.example .env.local   # ใส่ GEMINI_API_KEY (หรือ ANTHROPIC_API_KEY) และ ELEVENLABS_API_KEY
npm install
npm run dev                  # http://localhost:3000
```
ไมค์ในเบราว์เซอร์ใช้ได้เฉพาะ `localhost` หรือ `https://` เท่านั้น

## ไม่มี key จะเป็นอย่างไร
- `NEXT_PUBLIC_LOCAL_MODE` (ค่าเริ่มต้น true) = ฟังเสียงด้วย Web Speech API ของเบราว์เซอร์ ไม่ใช้ ElevenLabs STT · ตั้ง false เพื่อใช้ ElevenLabs Scribe
- ไม่มี `ELEVENLABS_API_KEY` (และ LOCAL_MODE=false) → ถอดเสียงไม่ได้ แอปให้กด “ฉันตอบได้” แทน
- ไม่มีคีย์ TTS → เสียงพูดใช้เสียงไทยของเบราว์เซอร์ · `ELEVENLABS_VOICE_ID` ไม่บังคับ
- ไม่มี `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` → ตัดสินด้วย accept list / ความคล้ายของประโยคอย่างเดียว
- ไฟล์เสียงล่วงหน้า: `node scripts/gen-audio.mjs` (ข้อความ → `public/audio/*.wav`)

## Deploy บน Vercel
1. อัปโค้ชขึ้น GitHub (โฟลเดอร์ `aphasia-web-v2` เป็น root ของ repo) → vercel.com → Add New Project → Import
2. ใส่ Environment Variables ตาม `.env.example`
3. กด Deploy → ได้ลิงก์ https ที่ใช้ไมค์ได้
4. Google login: ใส่ลิงก์ Vercel ใน Authorized JavaScript origins ของ OAuth client

## โครงสร้าง
- `lib/content.generated.ts` สร้างจาก `../product/content-bank.md` ด้วย `node scripts/build-content.mjs` (350 ข้อ)
- `lib/placement.ts` แบบทดสอบ 15 ข้อ + กฎจัดระดับ · `lib/rules.ts` เลื่อน/ทำซ้ำ/ลดด่าน
- `app/api/*` เรียก ElevenLabs/Gemini/Claude ฝั่ง server เท่านั้น · judge/chat ค้นเฉลยด้วย `itemId` ฝั่ง server และจำกัดอัตราต่อ IP (`lib/ratelimit.ts`)
- `lib/store.ts` เก็บ progress ใน localStorage แยกตามผู้ใช้ · `supabase/schema.sql` เตรียมไว้ย้ายฐานข้อมูล
# Phood
