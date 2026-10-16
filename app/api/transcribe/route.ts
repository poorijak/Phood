// เสียง → ข้อความ ด้วย ElevenLabs Scribe (ภาษาไทย)
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: "no_key" }, { status: 503 });
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof Blob) || file.size === 0) return Response.json({ error: "no_audio" }, { status: 400 });

  const send = (model: string) => {
    const body = new FormData();
    body.append("file", file, "speech.webm");
    body.append("model_id", model);
    body.append("language_code", "tha");
    body.append("tag_audio_events", "false");
    return fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": key },
      body,
      signal: AbortSignal.timeout(20_000),
    });
  };
  let res = await send(process.env.ELEVENLABS_STT_MODEL ?? "scribe_v2");
  if (res.status === 400 || res.status === 422) res = await send("scribe_v1");
  if (!res.ok) {
    console.warn("[stt] elevenlabs", res.status, (await res.text()).slice(0, 200));
    return Response.json({ error: "stt_failed", status: res.status }, { status: 502 });
  }
  const data = (await res.json()) as { text?: string };
  return Response.json({ text: (data.text ?? "").trim() });
}
