import { useState } from "react";
import { callAi, aiErrorMessage } from "../utils/ai.js";
import { parseJsonReply, elementToBlock } from "../utils/blocks.js";
import { suggestPrompt } from "../utils/prompts.js";
import { readProseSelection } from "../utils/dom.js";

function plainText(html) {
  return String(html || "").replace(/<[^>]*>/g, " ");
}

export function useSuggest({ busy, setBusy, getBlocks, insertBlock, flash, aiConfig, sel, setBar }) {
  const [suggest, setSuggest] = useState(null);

  // Honour the WHOLE selection: a table spans many paragraphs, not one.
  function openSuggest() {
    const picked = readProseSelection();
    let ids = picked ? picked.ids : [];
    let text = picked ? picked.hit.map((i) => (picked.kids[i] ? picked.kids[i].innerText : "")).join("\n\n") : "";

    if (!ids.length && sel) {
      const b = getBlocks().find((x) => x.id === sel);
      if (b) { ids = [sel]; text = plainText(b.html); }
    }

    if (!ids.length) { flash("SELECT SOME TEXT FIRST", true); return; }
    setSuggest({
      ids,
      bid: ids[0],
      text: "",
      replace: ids.length > 1,
      count: ids.length,
      preview: text.replace(/\s+/g, " ").slice(0, 220),
    });
    setBar(null);
  }

  function openSuggestFor(block) {
    setSuggest({ bid: block.id, text: "", preview: plainText(block.html).slice(0, 180) });
  }

  async function runSuggestFor(id, want, selectedIds) {
    if (busy) return;
    const blocks = getBlocks();
    const ids = selectedIds && selectedIds.length ? selectedIds : [id];
    const idx = blocks.findIndex((b) => b.id === ids[0]);
    if (idx < 0) return;

    const text = ids.map((i) => {
      const b = blocks.find((x) => x.id === i);
      return b ? plainText(b.html).replace(/\s+/g, " ").trim() : "";
    }).filter(Boolean).join("\n\n");
    if (text.length < 60 && !want) { flash("PARAGRAPH TOO SHORT TO WORK WITH.", true); return; }

    const multi = ids.length > 1;
    setBusy(true);
    flash(multi ? "READING " + ids.length + " PARAGRAPHS…" : "LOOKING AT THIS PARAGRAPH…");

    try {
      const res = await callAi(aiConfig, suggestPrompt(ids.length, want), text, multi ? 4000 : 1400);
      const blk = elementToBlock(parseJsonReply(res), "% who agree");
      if (!blk) throw new Error("no element");
      setBusy(false);

      // Suggest always appends — the source paragraphs stay, and the editor
      // deletes anything that reads as redundant afterwards.
      insertBlock(idx + 1, blk);
      flash("ADDED A " + blk.type.toUpperCase());
    } catch (e) {
      setBusy(false);
      flash(aiErrorMessage(e) || "NOTHING WORTH ADDING HERE.", true);
    }
  }

  function runSuggest() {
    const s = suggest;
    if (!s) return;
    setSuggest(null);
    runSuggestFor(s.bid, s.text, s.ids);
  }

  return {
    suggest,
    openSuggest,
    openSuggestFor,
    closeSuggest: () => setSuggest(null),
    setSuggestText: (text) => setSuggest({ ...suggest, text }),
    toggleReplace: () => setSuggest({ ...suggest, replace: !suggest.replace }),
    runSuggest,
  };
}
