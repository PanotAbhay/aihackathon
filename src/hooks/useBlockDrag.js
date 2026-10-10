import { useState, useRef } from "react";
import { NEW_BLOCK } from "../data/index.js";
import { moveBlock, moveSection } from "../utils/blocks.js";

// Drag state for palette items and block handles, plus the drop indicator position.
export function useBlockDrag({ getBlocks, save, insertBlock }) {
  const [drop, setDrop] = useState({ index: -1, group: null, y: 0 });
  const dragRef = useRef(null);

  function startDrag(e, payload, data, effect) {
    dragRef.current = payload;
    try {
      e.dataTransfer.setData("text/plain", data);
      e.dataTransfer.effectAllowed = effect;
    } catch { /* some browsers refuse dataTransfer writes */ }
  }

  function startNewDrag(e, type) {
    startDrag(e, { kind: "new", type }, type, "copy");
  }

  function startMoveDrag(e, id, run) {
    startDrag(e, { kind: "move", id, run }, id, "move");
  }

  function showDrop(index, group = null, y = 0) {
    if (drop.index !== index || drop.group !== group || drop.y !== y) setDrop({ index, group, y });
  }

  function clearDrop() {
    dragRef.current = null;
    setDrop({ index: -1, group: null, y: 0 });
  }

  function dropAt(index) {
    const d = dragRef.current;
    clearDrop();
    if (!d) return;
    if (d.kind === "new") { insertBlock(index, NEW_BLOCK[d.type]()); return; }
    const next = d.run ? moveSection(getBlocks(), d.id, index) : moveBlock(getBlocks(), d.id, index);
    if (next) save(next);
  }

  return { drop, startNewDrag, startMoveDrag, showDrop, clearDrop, dropAt };
}
