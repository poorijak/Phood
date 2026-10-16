const FILLERS = /(ครับ|ค่ะ|คะ|คับ|นะคะ|นะครับ|นะ|จ้ะ|จ้า|ด้วย|หน่อย|เลย|สิ)/g;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s.,!?"'“”‘’()\-_/\\|…]/g, "")
    .replace(/[๐-๙0-9]/g, "")
    .trim();
}

export function stripFillers(s: string): string {
  return normalize(s).replace(FILLERS, "");
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/** Dice coefficient ของ bigram ตัวอักษร (ใช้เทียบประโยคไทยที่ไม่มีช่องว่าง) */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a), B = bigrams(b);
  let inter = 0, total = 0;
  A.forEach((n, g) => { inter += Math.min(n, B.get(g) ?? 0); total += n; });
  B.forEach((n) => (total += n));
  return (2 * inter) / total;
}

/** ตรงเป๊ะกับ accept list (ไม่ใช้ AI) */
export function exactMatch(transcript: string, accept: string[]): boolean {
  const t = normalize(transcript);
  const tf = stripFillers(transcript);
  return accept.some((a) => {
    const n = normalize(a);
    return n === t || stripFillers(a) === tf || (tf.length > 0 && tf.includes(stripFillers(a)) && stripFillers(a).length >= 2);
  });
}
