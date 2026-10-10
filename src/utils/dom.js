// Write a value into a contentEditable node without stealing the caret.
export function bindContent(node, value, asHtml) {
  if (!node) return;
  if (document.activeElement === node) return;
  const v = value == null ? "" : String(value);
  if (asHtml) {
    if (node.innerHTML !== v) node.innerHTML = v;
    node.__ntLast = node.innerHTML;
  } else if (node.innerText !== v) {
    node.innerText = v;
  }
}

function selectionNode(selection) {
  let node = selection && selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentElement;
  return node;
}

// The prose paragraphs a selection touches — the WHOLE selection, not just its anchor.
export function readProseSelection() {
  const selection = window.getSelection();
  const node = selectionNode(selection);
  const wrap = node && node.closest ? node.closest("[data-prose]") : null;
  if (!wrap) return null;

  const all = JSON.parse(wrap.getAttribute("data-ids") || "[]");
  const kids = Array.from(wrap.children);
  const hit = [];
  if (selection.rangeCount && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    kids.forEach((p, i) => { if (range.intersectsNode(p)) hit.push(i); });
  }
  if (!hit.length) {
    const p = node.closest("p");
    hit.push(Math.max(0, p ? kids.indexOf(p) : 0));
  }
  return { selection, kids, hit, ids: hit.map((i) => all[i]).filter(Boolean) };
}

export function caretParagraphIndex(wrap) {
  const node = selectionNode(window.getSelection());
  const p = node && node.closest ? node.closest("p") : null;
  const kids = Array.from(wrap.children);
  const k = p ? kids.indexOf(p) : kids.length - 1;
  return k < 0 ? kids.length : k;
}

// Character offsets of a range within a paragraph's text.
export function paragraphOffsets(p, range) {
  const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
  let seen = 0;
  let start = 0;
  let end = 0;
  let n;
  while ((n = walk.nextNode())) {
    if (n === range.startContainer) start = seen + range.startOffset;
    if (n === range.endContainer) end = seen + range.endOffset;
    seen += n.nodeValue.length;
  }
  if (end < start) [start, end] = [end, start];
  return { start, end: Math.max(start, end) };
}

// Rebuild a range from character offsets.
export function rangeAtOffsets(p, start, end) {
  const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
  const r = document.createRange();
  let seen = 0;
  let startSet = false;
  let endSet = false;
  let n;
  while ((n = walk.nextNode())) {
    const len = n.nodeValue.length;
    if (!startSet && seen + len >= start) { r.setStart(n, Math.max(0, start - seen)); startSet = true; }
    if (!endSet && seen + len >= end) { r.setEnd(n, Math.max(0, end - seen)); endSet = true; break; }
    seen += len;
  }
  if (!startSet) r.setStart(p, 0);
  if (!endSet) r.setEnd(p, p.childNodes.length);
  return r;
}

// Find the live <p> nodes for a set of block ids.
export function findProseNodes(ids) {
  const out = [];
  document.querySelectorAll("[data-prose]").forEach((wrap) => {
    let all = [];
    try { all = JSON.parse(wrap.getAttribute("data-ids") || "[]"); } catch { /* malformed ids */ }
    const kids = Array.from(wrap.children);
    ids.forEach((id) => {
      const at = all.indexOf(id);
      if (at >= 0 && kids[at]) out.push(kids[at]);
    });
  });
  return out;
}

export function wrapRange(range, rwValue) {
  const span = document.createElement("span");
  span.setAttribute("data-rw", rwValue);
  try {
    range.surroundContents(span);
  } catch {
    span.appendChild(range.extractContents());
    range.insertNode(span);
  }
  return span;
}

export function unwrapRewriteSpans() {
  document.querySelectorAll("span[data-rw]").forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  });
}
