import { AI_MODELS } from "../data/index.js";
import { PDF_TRANSCRIBE_PROMPT } from "./prompts.js";

const ANTHROPIC_HEADERS = {
  "content-type": "application/json",
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

export function hasBuiltinModel() {
  return typeof window !== "undefined" && !!(window.claude && window.claude.complete);
}

export function resolveAiConfig(ai) {
  const a = ai || {};
  const provider = a.provider || "builtin";
  return { provider, model: a.model || AI_MODELS[provider], key: a.key || "" };
}

// Messages worth showing verbatim; anything else gets the caller's fallback.
export function aiErrorMessage(e) {
  const m = String((e && e.message) || e);
  return /api key|Settings|401|403|failed to fetch/i.test(m) ? m.toUpperCase().slice(0, 90) : null;
}

function geminiUrl(config) {
  return "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(config.model) + ":generateContent?key=" + encodeURIComponent(config.key);
}

function geminiText(d) {
  const p = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
  return String((p && p[0] && p[0].text) || "");
}

async function readError(label, r, length) {
  return new Error(label + " " + r.status + " " + (await r.text()).slice(0, length));
}

// One call site for every model provider.
export async function callAi(config, system, user, maxTokens) {
  if (config.provider === "builtin") {
    if (!hasBuiltinModel()) {
      throw new Error("The built-in model is only available inside the design tool. Open Settings and choose a provider.");
    }
    return String(await window.claude.complete({
      model: config.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }) || "");
  }

  if (config.provider === "ollama") {
    const r = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!r.ok) throw new Error("Ollama " + r.status);
    const d = await r.json();
    return String((d.message && d.message.content) || "");
  }

  if (!config.key) throw new Error("No API key set. Open Settings to add one.");

  if (config.provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { ...ANTHROPIC_HEADERS, "x-api-key": config.key },
      body: JSON.stringify({ model: config.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    });
    if (!r.ok) throw await readError("Anthropic", r, 120);
    const d = await r.json();
    return String((d.content && d.content[0] && d.content[0].text) || "");
  }

  if (config.provider === "openai") {
    const body = { model: config.model, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
    if (/^(gpt-5|o\d)/.test(config.model)) body.max_completion_tokens = maxTokens;
    else body.max_tokens = maxTokens;
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + config.key },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw await readError("OpenAI", r, 120);
    const d = await r.json();
    return String((d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "");
  }

  if (config.provider === "gemini") {
    const r = await fetch(geminiUrl(config), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!r.ok) throw await readError("Gemini", r, 120);
    return geminiText(await r.json());
  }

  throw new Error("Unknown provider");
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Scanned PDFs have no text layer — hand the file to a vision model instead.
export async function transcribePdf(config, file) {
  if (config.provider !== "anthropic" && config.provider !== "gemini") {
    throw new Error("That PDF is scanned images. Choose Anthropic or Gemini in Settings to read it, or paste the text.");
  }
  if (!config.key) throw new Error("That PDF is scanned. Add an API key in Settings to read it, or paste the text.");
  if (file.size > 28 * 1024 * 1024) throw new Error("That PDF is too large to read with AI (max ~28MB).");

  const data = await readAsBase64(file);

  if (config.provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { ...ANTHROPIC_HEADERS, "x-api-key": config.key, "anthropic-beta": "pdfs-2024-09-25" },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 16000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
            { type: "text", text: PDF_TRANSCRIBE_PROMPT },
          ],
        }],
      }),
    });
    if (!r.ok) throw await readError("Anthropic", r, 140);
    const d = await r.json();
    return String((d.content && d.content[0] && d.content[0].text) || "");
  }

  const r = await fetch(geminiUrl(config), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: "application/pdf", data } }, { text: PDF_TRANSCRIBE_PROMPT }] }],
      generationConfig: { maxOutputTokens: 16000 },
    }),
  });
  if (!r.ok) throw await readError("Gemini", r, 140);
  return geminiText(await r.json());
}
