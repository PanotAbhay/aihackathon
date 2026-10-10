import { useState } from "react";
import { STORAGE_KEYS, TEMPLATES } from "../data/index.js";
import { readStorage, writeStorage } from "../utils/storage.js";

// The active template, plus whether the starter window should open (first visit: no saved document yet).
export function useTemplate() {
  const [templateKey, setTemplateKey] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.template);
    return TEMPLATES[saved] ? saved : "news";
  });
  const [pickerOpen, setPickerOpen] = useState(() => !readStorage(STORAGE_KEYS.doc));

  function applyTemplate(key) {
    if (!TEMPLATES[key]) return;
    setTemplateKey(key);
    writeStorage(STORAGE_KEYS.template, key);
  }

  return {
    template: TEMPLATES[templateKey],
    applyTemplate,
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
  };
}
