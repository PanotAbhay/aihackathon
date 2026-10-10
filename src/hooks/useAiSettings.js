import { useState } from "react";
import { AI_MODELS, STORAGE_KEYS } from "../data/index.js";
import { readJson, writeStorage } from "../utils/storage.js";
import { resolveAiConfig } from "../utils/ai.js";

// Used only until the writer saves their own choice in Settings.
const DEFAULT_AI = { provider: "openai", model: AI_MODELS.openai, key: "" };

export function useAiSettings() {
  const [ai, setAi] = useState(() => readJson(STORAGE_KEYS.ai) || DEFAULT_AI);

  function saveAi(patch) {
    const next = { ...ai, ...patch };
    setAi(next);
    writeStorage(STORAGE_KEYS.ai, JSON.stringify(next));
  }

  return { aiConfig: resolveAiConfig(ai), saveAi };
}
