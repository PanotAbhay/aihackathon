import { useState } from "react";
import { STORAGE_KEYS } from "../data/index.js";
import { readStorage, writeStorage } from "../utils/storage.js";

export function useZoom(initial = 0.75) {
  const [zoom, setZoom] = useState(() => parseFloat(readStorage(STORAGE_KEYS.zoom)) || initial);

  function changeZoom(delta) {
    const z = Math.min(1.5, Math.max(0.5, Math.round((zoom + delta) * 100) / 100));
    setZoom(z);
    writeStorage(STORAGE_KEYS.zoom, String(z));
  }

  return { zoom, zoomIn: () => changeZoom(0.05), zoomOut: () => changeZoom(-0.05) };
}
