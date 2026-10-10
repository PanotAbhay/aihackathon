import { useState, useRef } from "react";
import { NEW_BLOCK, AI_FILL_TYPES } from "../data/index.js";
import { moveBlock, moveSection } from "../utils/blocks.js";
import { selectedProseIds } from "../utils/dom.js";

// Drag state for palette items and block handles, plus the drop indicator position.
export function useBlockDrag({ getBlocks, save, insertBlock, onFill }) {
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
    // Remember any paragraphs the editor had selected; they become the AI's source text.
    startDrag(e, { kind: "new", type, selectedIds: selectedProseIds() }, type, "copy");
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

  // `prose` is set when dropping beside paragraphs: { groupIds, adjacentId }.
  function dropAt(index, prose) {
    const d = dragRef.current;
    clearDrop();
    if (!d) return;
    if (d.kind === "move") {
      const next = d.run ? moveSection(getBlocks(), d.id, index) : moveBlock(getBlocks(), d.id, index);
      if (next) save(next);
      return;
    }
    const id = insertBlock(index, NEW_BLOCK[d.type]());
    if (!prose || !AI_FILL_TYPES.includes(d.type)) return;
    const selected = d.selectedIds.filter((s) => prose.groupIds.includes(s));
    onFill(id, d.type, selected.length ? selected : [prose.adjacentId]);
  }

  return { drop, startNewDrag, startMoveDrag, showDrop, clearDrop, dropAt };
}
