import { useState } from "react";
import { STORAGE_KEYS } from "../data/index.js";
import { readJson, writeStorage } from "../utils/storage.js";
import { hasBuiltinModel, resolveAiConfig } from "../utils/ai.js";

export function useAiSettings() {
  const [ai, setAi] = useState(() =>
    readJson(STORAGE_KEYS.ai) || { provider: hasBuiltinModel() ? "builtin" : "anthropic", model: "", key: "" }
  );

  function saveAi(patch) {
    const next = { ...ai, ...patch };
    setAi(next);
    writeStorage(STORAGE_KEYS.ai, JSON.stringify(next));
  }

  return { aiConfig: resolveAiConfig(ai), saveAi };
}
