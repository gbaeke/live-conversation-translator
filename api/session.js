const ALLOWED_TARGET_LANGUAGES = new Set(["en", "nl"]);
const ALLOWED_SOURCE_LANGUAGES = new Set(["auto", "ro", "hu"]);

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export async function createTranslationClientSecret(body = {}) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Translation is not configured yet. Add OPENAI_API_KEY to the server environment, then try again.");
    error.status = 503;
    error.code = "missing_api_key";
    throw error;
  }

  const targetLanguage = body.targetLanguage ?? "en";
  const sourceLanguage = body.sourceLanguage ?? "auto";

  if (!ALLOWED_TARGET_LANGUAGES.has(targetLanguage)) {
    const error = new Error("Target language must be en or nl.");
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_SOURCE_LANGUAGES.has(sourceLanguage)) {
    const error = new Error("Source language must be auto, ro, or hu.");
    error.status = 400;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/realtime/translations/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": "live-conversation-translator",
    },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 600 },
      session: {
        model: "gpt-realtime-translate",
        audio: {
          input: {
            transcription: { model: "gpt-realtime-whisper" },
            noise_reduction: { type: "far_field" },
          },
          output: { language: targetLanguage },
        },
      },
    }),
  });

  return { status: response.status, body: await response.json() };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    return json(res, 400, { error: "Request body must be valid JSON." });
  }

  try {
    const result = await createTranslationClientSecret(body);
    return json(res, result.status, result.body);
  } catch (error) {
    if (error.status) return json(res, error.status, { error: error.message, ...(error.code ? { code: error.code } : {}) });
    console.error("Unable to create translation client secret", error);
    return json(res, 502, { error: "OpenAI could not create a translation session. Try again." });
  }
}
