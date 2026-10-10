import { useState } from "react";
import { callAi, aiErrorMessage } from "../utils/ai.js";
import { parseJsonReply, elementToBlock } from "../utils/blocks.js";
import { elementPrompt } from "../utils/prompts.js";

function plainText(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Replace a freshly dropped template block with one the AI builds from nearby paragraphs.
export function useAiFill({ getBlocks, save, flash, aiConfig }) {
  const [building, setBuilding] = useState([]);

  async function fillFromText(blockId, type, sourceIds) {
    const blocks = getBlocks();
    const text = sourceIds
      .map((id) => plainText((blocks.find((b) => b.id === id) || {}).html))
      .filter(Boolean)
      .join("\n\n");
    if (!text) return;

    const count = sourceIds.length;
    setBuilding((ids) => [...ids, blockId]);
    flash("BUILDING " + type.toUpperCase() + " FROM " + (count > 1 ? count + " PARAGRAPHS" : "THE PARAGRAPH") + "…");

    try {
      const res = await callAi(aiConfig, elementPrompt(count, type), text, count > 1 ? 4000 : 1400);
      const blk = elementToBlock(parseJsonReply(res), "% who agree");
      if (!blk) throw new Error("no element");
      const cur = getBlocks();
      // The editor may have deleted the placeholder while the model was working.
      if (!cur.some((b) => b.id === blockId)) return;
      save(cur.map((b) => (b.id === blockId ? { ...blk, id: blockId } : b)));
      flash("BUILT " + blk.type.toUpperCase() + " FROM THE TEXT — CTRL+Z FOR THE BLANK ONE");
    } catch (e) {
      flash(aiErrorMessage(e) || "COULDN’T BUILD IT FROM THE TEXT — FILL IN THE BLANK ONE BY HAND.", true);
    } finally {
      setBuilding((ids) => ids.filter((id) => id !== blockId));
    }
  }

  return { building, fillFromText };
}
