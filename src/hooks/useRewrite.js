import { useState, useEffect, useRef } from "react";
import { callAi, aiErrorMessage } from "../utils/ai.js";
import { stripFences } from "../utils/blocks.js";
import { fragmentRewritePrompt, paragraphRewritePrompt } from "../utils/prompts.js";
import {
  readProseSelection,
  paragraphOffsets,
  rangeAtOffsets,
  findProseNodes,
  wrapRange,
  unwrapRewriteSpans,
} from "../utils/dom.js";

const REWRITE_FAILED = "COULDN’T REWRITE — TRY AGAIN.";

// Split a tagged reply ("[[1]] … [[2]] …") back into paragraphs, so nothing can drift out of order.
function readTaggedParts(out, count) {
  const parts = [];
  const re = /\[\[\s*(\d+)\s*\]\]/g;
  const marks = [];
  let m;
  while ((m = re.exec(out))) marks.push({ n: parseInt(m[1], 10), at: m.index, end: re.lastIndex });
  if (marks.length) {
    marks.forEach((mk, k) => {
      const stop = k + 1 < marks.length ? marks[k + 1].at : out.length;
      const body = out.slice(mk.end, stop).replace(/\s+/g, " ").trim();
      if (mk.n >= 1 && mk.n <= count && body) parts[mk.n - 1] = body;
    });
    return parts;
  }
  const chunks = out.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (chunks.length !== count) throw new Error("paragraph count mismatch");
  return chunks;
}

export function useRewrite({ busy, setBusy, getBlocks, save, flash, aiConfig, setBar }) {
  const [rewrite, setRewrite] = useState(null);
  const marksRef = useRef({ ids: null, frag: null });
  const marksTimerRef = useRef(null);

  useEffect(() => () => clearInterval(marksTimerRef.current), []);

  function openRewrite() {
    const picked = readProseSelection();
    if (!picked || !picked.ids.length) { flash("SELECT SOME BODY TEXT FIRST", true); return; }
    const { selection, kids, hit, ids } = picked;

    // A partial selection inside ONE paragraph rewrites only that fragment.
    if (hit.length === 1 && selection.rangeCount && !selection.isCollapsed) {
      const p = kids[hit[0]];
      const off = paragraphOffsets(p, selection.getRangeAt(0));
      const whole = p.textContent || "";
      const text = whole.slice(off.start, off.end);
      if (text.trim() && text.trim().length < whole.trim().length) {
        setRewrite({
          ids: [ids[0]],
          count: 1,
          text: "",
          frag: { id: ids[0], start: off.start, end: off.end },
          preview: text.replace(/\s+/g, " ").slice(0, 260),
        });
        setBar(null);
        return;
      }
    }

    const text = hit.map((i) => (kids[i] ? kids[i].innerText : "")).join("\n\n");
    setRewrite({ ids, count: ids.length, text: "", preview: text.replace(/\s+/g, " ").slice(0, 260) });
    setBar(null);
  }

  // Re-applied on a timer while the call runs, since re-rendering can drop the marks.
  function applyMarks() {
    const { ids, frag } = marksRef.current;
    unwrapRewriteSpans();
    document.querySelectorAll('[data-rw="1"]').forEach((n) => n.removeAttribute("data-rw"));
    if (!ids) return;
    if (frag) {
      const p = findProseNodes([frag.id])[0];
      if (p) wrapRange(rangeAtOffsets(p, frag.start, frag.end), "1");
      return;
    }
    findProseNodes(ids).forEach((n) => n.setAttribute("data-rw", "1"));
  }

  function markRewriting(ids, frag) {
    marksRef.current = { ids, frag: ids ? frag || null : null };
    clearInterval(marksTimerRef.current);
    marksTimerRef.current = null;
    applyMarks();
    if (ids) marksTimerRef.current = setInterval(applyMarks, 120);
  }

  function flashRewritten(ids, frag) {
    setTimeout(() => {
      if (frag) {
        const p = findProseNodes([frag.id])[0];
        if (p) {
          wrapRange(rangeAtOffsets(p, frag.start, frag.end), "done");
          setTimeout(unwrapRewriteSpans, 600);
          return;
        }
      }
      findProseNodes(ids).forEach((n) => {
        n.setAttribute("data-rw", "done");
        setTimeout(() => n.removeAttribute("data-rw"), 600);
      });
    }, 30);
  }

  function fail(e) {
    markRewriting(null);
    setBusy(false);
    flash(aiErrorMessage(e) || REWRITE_FAILED, true);
  }

  // Rewrite only the selected run of text, leaving the rest of the paragraph alone.
  async function rewriteFragment(frag, how) {
    if (busy) return;
    const p = findProseNodes([frag.id])[0];
    if (!p) { flash("LOST THE SELECTION — TRY AGAIN", true); return; }
    const whole = p.textContent || "";
    const picked = whole.slice(frag.start, frag.end);
    if (!picked.trim()) return;

    setBusy(true);
    markRewriting([frag.id], frag);
    flash("REWRITING SELECTION…");

    const user = "PARAGRAPH CONTEXT:\n" + whole.replace(/\s+/g, " ").trim() + "\n\nFRAGMENT TO REWRITE:\n" + picked;

    try {
      const res = await callAi(aiConfig, fragmentRewritePrompt(how), user, Math.max(400, picked.length * 3));
      const out = stripFences(res).replace(/^["“](.*)["”]$/s, "$1").replace(/\s+/g, " ").trim();
      if (!out) throw new Error("empty");

      // Preserve the original edge whitespace exactly.
      const lead = (picked.match(/^\s*/) || [""])[0];
      const tail = (picked.match(/\s*$/) || [""])[0];

      markRewriting(null);
      const live = findProseNodes([frag.id])[0];
      if (!live) throw new Error("lost");
      const r = rangeAtOffsets(live, frag.start, frag.end);
      r.deleteContents();
      r.insertNode(document.createTextNode(lead + out + tail));
      live.normalize();

      const cur = getBlocks().slice();
      const at = cur.findIndex((x) => x.id === frag.id);
      if (at < 0) throw new Error("lost");
      cur[at] = { ...cur[at], html: live.innerHTML };
      live.__ntLast = live.innerHTML;

      setBusy(false);
      save(cur);
      flashRewritten([frag.id], { id: frag.id, start: frag.start, end: frag.start + (lead + out + tail).length });
      flash("REWROTE THE SELECTION — CTRL+Z TO REVERT");
    } catch (e) {
      fail(e);
    }
  }

  async function rewriteParagraphs(ids, how) {
    if (busy) return;
    const blocks = getBlocks();
    const plain = ids.map((id) => {
      const b = blocks.find((x) => x.id === id);
      return String(b ? b.html || "" : "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    });
    if (!plain.join("").trim()) return;

    setBusy(true);
    markRewriting(ids);
    flash("REWRITING…");

    try {
      const tagged = plain.map((p, i) => "[[" + (i + 1) + "]] " + p).join("\n\n");
      const res = await callAi(aiConfig, paragraphRewritePrompt(how), tagged, Math.max(1200, plain.join(" ").length));
      const parts = readTaggedParts(stripFences(res), ids.length);
      if (!parts.filter(Boolean).length) throw new Error("empty");

      const cur = getBlocks().slice();
      let changed = 0;
      ids.forEach((id, k) => {
        if (parts[k] == null) return;
        const at = cur.findIndex((x) => x.id === id);
        if (at < 0) return;
        cur[at] = { ...cur[at], html: parts[k] };
        changed += 1;
      });
      markRewriting(null);
      setBusy(false);
      if (!changed) throw new Error("no change");
      save(cur);
      flashRewritten(ids);
      flash("REWROTE " + changed + " PARAGRAPH" + (changed > 1 ? "S" : "") + " — CTRL+Z TO REVERT");
    } catch (e) {
      fail(e);
    }
  }

  function runRewrite(how) {
    const r = rewrite;
    if (!r) return;
    setRewrite(null);
    if (r.frag) rewriteFragment(r.frag, how);
    else rewriteParagraphs(r.ids, how);
  }

  return {
    rewrite,
    openRewrite,
    closeRewrite: () => setRewrite(null),
    setRewriteText: (text) => setRewrite({ ...rewrite, text }),
    runRewrite,
  };
}
