import { useLayoutEffect, useState } from "react";
import { STORAGE_KEYS } from "../data/index.js";
import { DEFAULT_PRESET, SIZE_STEPS, TEXT_LEVELS, presetSettings } from "../data/fontSystems.js";
import { readJson, writeStorage } from "../utils/storage.js";
import { applyFonts } from "../utils/fonts.js";

// Older saves stored raw numbers per level; anything not in today's shape starts fresh.
function isCurrentShape(saved) {
  return !!saved && TEXT_LEVELS.every((l) => saved[l.id] && SIZE_STEPS.some((s) => s.id === saved[l.id].size));
}

export function useFontSettings() {
  const [fonts, setFonts] = useState(() => {
    const saved = readJson(STORAGE_KEYS.fonts);
    return isCurrentShape(saved) ? saved : presetSettings(DEFAULT_PRESET);
  });

  // Apply before paint so a saved preset doesn't flash the default fonts on load,
  // and on every change for the live preview on the article behind the panel.
  useLayoutEffect(() => {
    applyFonts(fonts);
    writeStorage(STORAGE_KEYS.fonts, JSON.stringify(fonts));
  }, [fonts]);

  function setLevel(level, patch) {
    setFonts((f) => ({ ...f, [level]: { ...f[level], ...patch } }));
  }
  function applyPreset(id) {
    setFonts(presetSettings(id));
  }
  function reset() {
    setFonts(presetSettings(DEFAULT_PRESET));
  }

  return { fonts, setLevel, applyPreset, reset };
}
