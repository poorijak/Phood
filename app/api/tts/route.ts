// ข้อความ → เสียงไทย ด้วย ElevenLabs (ถ้าไม่มี key/voice ให้ client ใช้เสียงเบราว์เซอร์แทน)
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) return Response.json({ error: "no_key" }, { status: 503 });
  const { text } = (await req.json()) as { text?: string };
  if (!text || text.length > 400) return Response.json({ error: "bad_text" }, { status: 400 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_TTS_MODEL ?? "eleven_v3",
      language_code: "th",
    }),
  });
  if (!res.ok) return Response.json({ error: "tts_failed", status: res.status }, { status: 502 });
  return new Response(res.body, { headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400" } });
}
