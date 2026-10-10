import { useState, useRef } from "react";
import { STORAGE_KEYS } from "../data/index.js";
import { readStorage, writeStorage } from "../utils/storage.js";
import { loadSavedBlocks, cloneBlock, withId } from "../utils/blocks.js";

const UNDO_LIMIT = 80;

export function useDocument(flash) {
  const [blocks, setBlocks] = useState(loadSavedBlocks);
  // Async AI calls and blur handlers need the latest document, not the one from their render.
  const blocksRef = useRef(blocks);
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const photoWarnRef = useRef(false);

  function getBlocks() {
    return blocksRef.current;
  }

  function write(next) {
    // Keep the outgoing document on disk as well as in memory, so a reload
    // (which clears the undo stack) can never strand the user without a copy.
    const prev = readStorage(STORAGE_KEYS.doc);
    if (prev && prev.length > 2) writeStorage(STORAGE_KEYS.docPrev, prev);
    blocksRef.current = next;
    setBlocks(next);
    if (writeStorage(STORAGE_KEYS.doc, JSON.stringify(next))) {
      photoWarnRef.current = false;
      return;
    }

    // Storage full — keep the text safe, but never discard photos silently.
    let dropped = 0;
    const light = next.map((b) => {
      if (!b.slots) return b;
      const slots = b.slots.map((s) => {
        if (s && s.length > 4000) { dropped += 1; return ""; }
        return s;
      });
      return { ...b, slots };
    });
    if (!writeStorage(STORAGE_KEYS.doc, JSON.stringify(light))) {
      flash("AUTOSAVE FAILED — COPY YOUR HTML BEFORE RELOADING", true);
      return;
    }
    if (dropped && !photoWarnRef.current) {
      photoWarnRef.current = true;
      flash(dropped + " PHOTO" + (dropped > 1 ? "S" : "") + " TOO LARGE TO AUTOSAVE — RE-ADD AFTER RELOAD", true);
    }
  }

  function save(next) {
    // Snapshot the outgoing document so Ctrl+Z can bring it back.
    undoRef.current.push(blocksRef.current);
    if (undoRef.current.length > UNDO_LIMIT) undoRef.current.shift();
    redoRef.current = [];
    write(next);
  }

  function step(from, to, emptyMsg, doneMsg) {
    if (!from.current.length) {
      flash(emptyMsg, true);
      return false;
    }
    document.activeElement?.blur?.();
    to.current.push(blocksRef.current);
    write(from.current.pop());
    flash(doneMsg);
    return true;
  }

  function undo() {
    return step(undoRef, redoRef, "NOTHING TO UNDO", "UNDONE");
  }

  function redo() {
    return step(redoRef, undoRef, "NOTHING TO REDO", "REDONE");
  }

  function patch(id, fn) {
    save(blocksRef.current.map((b) => {
      if (b.id !== id) return b;
      const copy = cloneBlock(b);
      fn(copy);
      return copy;
    }));
  }

  function insertAt(index, block) {
    const next = blocksRef.current.slice();
    next.splice(index, 0, withId(block));
    save(next);
  }

  return { blocks, getBlocks, save, patch, insertAt, undo, redo };
}
