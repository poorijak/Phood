// เสียง → ข้อความ ด้วย ElevenLabs Scribe (ภาษาไทย)
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: "no_key" }, { status: 503 });
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof Blob) || file.size === 0) return Response.json({ error: "no_audio" }, { status: 400 });

  const body = new FormData();
  body.append("file", file, "speech.webm");
  body.append("model_id", process.env.ELEVENLABS_STT_MODEL ?? "scribe_v2");
  body.append("language_code", "tha");
  body.append("tag_audio_events", "false");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body,
  });
  if (!res.ok) return Response.json({ error: "stt_failed", status: res.status }, { status: 502 });
  const data = (await res.json()) as { text?: string };
  return Response.json({ text: (data.text ?? "").trim() });
}
