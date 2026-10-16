import Anthropic from "@anthropic-ai/sdk";

// เลือกผู้ให้บริการ LLM จาก env: GEMINI_API_KEY (ฟรี) → ANTHROPIC_API_KEY → ไม่มี (ใช้กฎในเครื่อง)
// ชื่อ hasClaude/ask คงไว้ เพื่อไม่ต้องแก้ route อื่น
const provider = (): "gemini" | "anthropic" | "none" =>
  process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "none";

export const hasClaude = () => provider() !== "none";
export const JUDGE_MODEL = process.env.CLAUDE_JUDGE_MODEL ?? "claude-haiku-5-5";
export const CHAT_MODEL = process.env.CLAUDE_CHAT_MODEL ?? "claude-sonnet-5-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let client: Anthropic | null = null;
function claude(): Anthropic {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

async function askGemini(system: string, user: string, maxTokens: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        // รุ่นที่มี "thinking" นับ token คิดรวมใน maxOutputTokens จึงเผื่อไว้
        generationConfig: { maxOutputTokens: Math.max(512, maxTokens * 4), temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

export async function ask(model: string, system: string, user: string, maxTokens = 300): Promise<string> {
  if (provider() === "gemini") return askGemini(system, user, maxTokens);
  const res = await claude().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export function parseJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}
