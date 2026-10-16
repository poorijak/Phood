# Aphasia AI — เว็บแอปเดโม (Next.js)

โค้ชฝึกพูดที่บ้าน: แบบทดสอบ 15 ข้อ → จัดระดับ 1–3 → ฝึกทีละด่าน (คลัง 350 ข้อ) · แผนอยู่ที่ `../product/implementation-plan.md`

## รันในเครื่อง
```bash
cp .env.example .env.local   # ใส่ ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
npm install
npm run dev                  # http://localhost:3000
```
ไมค์ในเบราว์เซอร์ใช้ได้เฉพาะ `localhost` หรือ `https://` เท่านั้น

## ไม่มี key จะเป็นอย่างไร
- ไม่มี `ELEVENLABS_API_KEY` → ถอดเสียงไม่ได้ แอปให้กด “ฉันตอบได้” แทน
- ไม่มี `ELEVENLABS_VOICE_ID` → เสียงพูดใช้เสียงไทยของเบราว์เซอร์แทน
- ไม่มี `ANTHROPIC_API_KEY` → ตัดสินด้วย accept list / ความคล้ายของประโยคอย่างเดียว

## Deploy บน Vercel
1. อัปโค้ชขึ้น GitHub (โฟลเดอร์ `aphasia-web` เป็น root ของ repo) → vercel.com → Add New Project → Import
2. ใส่ Environment Variables ตาม `.env.example`
3. กด Deploy → ได้ลิงก์ https ที่ใช้ไมค์ได้
4. Google login: ใส่ลิงก์ Vercel ใน Authorized JavaScript origins ของ OAuth client

## โครงสร้าง
- `lib/content.generated.ts` สร้างจาก `../product/content-bank.md` ด้วย `node scripts/build-content.mjs` (350 ข้อ)
- `lib/placement.ts` แบบทดสอบ 15 ข้อ + กฎจัดระดับ · `lib/rules.ts` เลื่อน/ทำซ้ำ/ลดด่าน
- `app/api/*` เรียก ElevenLabs/Claude ฝั่ง server เท่านั้น
- `lib/store.ts` เก็บ progress ใน localStorage · `supabase/schema.sql` เตรียมไว้ย้ายฐานข้อมูล
