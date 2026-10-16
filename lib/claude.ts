import Anthropic from "@anthropic-ai/sdk";

export const hasClaude = () => !!process.env.ANTHROPIC_API_KEY;
export const JUDGE_MODEL = process.env.CLAUDE_JUDGE_MODEL ?? "claude-haiku-5-5";
export const CHAT_MODEL = process.env.CLAUDE_CHAT_MODEL ?? "claude-sonnet-5-5";

let client: Anthropic | null = null;
export function claude(): Anthropic {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function ask(model: string, system: string, user: string, maxTokens = 300): Promise<string> {
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
