import { NEW_BLOCK, IMAGE_TYPES, HEADING_TYPES, STORAGE_KEYS } from "../data/index.js";
import { readJson } from "./storage.js";

let uid = 0;

export function nid() {
  uid += 1;
  return "b" + Date.now().toString(36) + uid;
}

export function withId(block) {
  return { id: nid(), ...block };
}

export function cloneBlock(block) {
  return JSON.parse(JSON.stringify(block));
}

export function createStarterBlocks() {
  return [
    { id: nid(), type: "h1", html: "Your headline goes here" },
    { id: nid(), type: "standfirst", html: "A standfirst summarising the piece in one or two sentences." },
    { id: nid(), type: "byline", a: "Reporter Name", b: "Desk" },
    withId(NEW_BLOCK.image()),
    withId(NEW_BLOCK.dropcap()),
  ];
}

export function loadSavedBlocks() {
  const saved = readJson(STORAGE_KEYS.doc);
  return Array.isArray(saved) && saved.length ? saved : createStarterBlocks();
}

export function countWords(blocks) {
  return blocks.reduce((n, b) => {
    const t = [b.html, b.a, b.b].filter(Boolean).join(" ").replace(/<[^>]*>/g, " ");
    return n + t.split(/\s+/).filter(Boolean).length;
  }, 0);
}

// A sub-heading owns every block after it until the next heading.
export function sectionEnd(blocks, i) {
  if (!HEADING_TYPES.includes(blocks[i].type)) return i + 1;
  let j = i + 1;
  while (j < blocks.length && !["h1", "h2", "h3"].includes(blocks[j].type)) j += 1;
  return j;
}

export function moveBlock(blocks, id, index) {
  const cur = blocks.slice();
  const from = cur.findIndex((b) => b.id === id);
  if (from < 0) return null;
  const [item] = cur.splice(from, 1);
  let to = index;
  if (from < index) to -= 1;
  cur.splice(Math.max(0, Math.min(cur.length, to)), 0, item);
  return cur;
}

export function moveSection(blocks, id, index) {
  const cur = blocks.slice();
  const from = cur.findIndex((b) => b.id === id);
  if (from < 0) return null;
  const end = sectionEnd(cur, from);
  const count = end - from;
  if (index > from && index < end) return null;
  const items = cur.splice(from, count);
  let to = index;
  if (from < index) to -= count;
  to = Math.max(0, Math.min(cur.length, to));
  cur.splice(to, 0, ...items);
  return cur;
}

// Read a prose field back into one block per paragraph.
export function mergeProse(blocks, ids, node) {
  const ps = Array.from(node.children).filter((n) => n.tagName === "P");
  let htmls = ps.length ? ps.map((p) => p.innerHTML) : [node.innerHTML];
  htmls = htmls.filter((h) => String(h).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0);
  if (!htmls.length) htmls = [""];

  const cur = blocks.slice();
  const start = cur.findIndex((b) => b.id === ids[0]);
  if (start < 0) return null;

  const out = htmls.map((h, idx) => {
    const old = cur[start + idx];
    if (old && ids.includes(old.id)) return { ...old, html: h };
    return { id: nid(), type: "body", html: h };
  });
  if (JSON.stringify(cur.slice(start, start + ids.length)) === JSON.stringify(out)) return null;
  cur.splice(start, ids.length, ...out);
  return cur;
}

export function plainParas(text) {
  const raw = String(text == null ? "" : text).split("\n");
  const out = [];
  let hardBreak = true;
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i].trim();
    // A blank line is an explicit paragraph break — never swallow it.
    if (!t) { hardBreak = true; continue; }
    const prev = out.length ? out[out.length - 1] : null;
    // Only un-wrap lines that are genuinely a wrapped continuation: directly
    // below the previous line, which is long and lacks terminal punctuation.
    // Short unpunctuated lines are headings, bylines and table rows, not prose.
    const wrapped = prev && !hardBreak && prev.length > 60 &&
      !/[.!?:;…"”’)\]]$/.test(prev) && !/^[•\-–—*\d]/.test(t);
    if (wrapped) out[out.length - 1] = prev + " " + t;
    else out.push(t);
    hardBreak = false;
  }
  return out;
}

export function stripFences(reply) {
  return String(reply || "").trim().replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim();
}

export function parseJsonReply(reply) {
  let s = stripFences(reply);
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a > 0 || b < s.length - 1) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

function toBars(bars) {
  return bars.map((r) => ({ label: String(r.label).toUpperCase(), value: parseFloat(r.value) || 0 }));
}

function toListHtml(items) {
  return items.map((i) => "<li>" + String(i) + "</li>").join("");
}

function toTableRows(rows) {
  const out = rows.map((r) => (Array.isArray(r) ? r : [r]).map(String));
  const width = Math.max(0, ...out.map((r) => r.length));
  out.forEach((r) => { while (r.length < width) r.push(""); });
  return out;
}

// Turn one element from a model's JSON reply into a block (without an id).
export function elementToBlock(o, pollNote = "") {
  const t = String(o.type || "").toLowerCase();
  const hasBars = Array.isArray(o.bars) && o.bars.length;
  const hasRows = Array.isArray(o.rows) && o.rows.length;
  const hasItems = Array.isArray(o.items) && o.items.length;

  if (HEADING_TYPES.includes(t) && o.text) return { type: t, html: o.text };
  if (t === "quote" && o.text) {
    return { type: "quote", a: String(o.text).replace(/^["“]|["”]$/g, ""), b: o.cite ? "— " + String(o.cite).toUpperCase() : "" };
  }
  if (IMAGE_TYPES.includes(t)) {
    const blk = NEW_BLOCK[t]();
    blk.a = o.caption || blk.a;
    return blk;
  }
  if (t === "stats" && Array.isArray(o.cells) && o.cells.length) {
    return {
      type: "stats",
      a: o.title || "By the numbers",
      b: o.note || "",
      cells: o.cells.slice(0, 4).map((c) => ({ value: String(c.value), label: String(c.label).toUpperCase() })),
    };
  }
  if (t === "chart" && hasBars) return { type: "chart", a: o.title || "Chart", b: o.note || "", bars: toBars(o.bars) };
  if (t === "line" && hasBars) return { type: "line", a: o.title || "Trend", b: o.note || "", bars: toBars(o.bars) };
  if (t === "poll" && hasBars) return { type: "poll", a: o.title || "Poll", b: o.note || pollNote, bars: toBars(o.bars) };
  if (t === "timeline" && hasRows) {
    return {
      type: "timeline",
      rows: o.rows.map((r) => ({ d: String(r.d || r.date || ""), t: String(r.t || r.title || ""), x: String(r.x || r.text || "") })),
    };
  }
  if (t === "table" && hasRows) return { type: "table", a: o.title || "", rows: toTableRows(o.rows) };
  if (t === "nutshell" && hasItems) return { type: "nutshell", a: o.title || "The Nutshell", html: toListHtml(o.items) };
  if ((t === "bullets" || t === "numbered") && hasItems) return { type: t, html: toListHtml(o.items) };
  return null;
}

function normalize(s) {
  return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// Weave the model's plan of insertions around the untouched source paragraphs.
export function blocksFromPlan(plan, paras) {
  const headline = plan.headline || paras[0];
  const author = plan.author || "Staff Correspondent";
  let standfirst = plan.standfirst || "";
  // A standfirst that just restates the headline is noise.
  if (normalize(standfirst) === normalize(headline)) standfirst = "";

  // Source lines already promoted into the header must not repeat as body copy.
  const skip = {};
  [headline, standfirst, author].forEach((v) => {
    const k = normalize(v);
    if (!k) return;
    skip[k] = true;
    skip["by" + k] = true;
    skip["byline" + k] = true;
  });

  const blocks = [
    { id: nid(), type: "h1", html: headline },
    { id: nid(), type: "standfirst", html: standfirst },
    { id: nid(), type: "byline", a: author, b: plan.desk || "Nutshell Today" },
  ];
  const ins = Array.isArray(plan.insertions) ? plan.insertions.slice() : [];
  ins.sort((x, y) => (x.after | 0) - (y.after | 0));

  const counts = { h2: 0, quote: 0, img: 0, data: 0 };
  function emit(o) {
    if (String(o.type || "").toLowerCase() === "divider") { blocks.push({ id: nid(), type: "divider" }); return; }
    const blk = elementToBlock(o);
    if (!blk) return;
    blocks.push(withId(blk));
    if (blk.type === "h2") counts.h2++;
    else if (blk.type === "quote") counts.quote++;
    else if (IMAGE_TYPES.includes(blk.type)) counts.img++;
    else if (["stats", "chart", "line", "poll", "timeline", "table"].includes(blk.type)) counts.data++;
  }
  function emitAfter(i) {
    ins.filter((o) => (o.after | 0) === i).forEach(emit);
  }

  // Paragraphs an element stands in for must not also appear as body copy.
  const consumed = {};
  ins.forEach((o) => {
    const to = parseInt(o.replaceTo, 10);
    if (!isFinite(to)) return;
    for (let k = (o.after | 0) + 1; k <= to && k < paras.length; k++) consumed[k] = true;
  });

  ins.filter((o) => (o.after | 0) < 0).forEach(emit);
  let ledeDone = false;
  for (let i = 0; i < paras.length; i++) {
    if (consumed[i]) { emitAfter(i); continue; }
    const k = normalize(paras[i]);
    // Drop the source's own headline / byline / standfirst lines, and any
    // sub-heading the plan already lifted verbatim out of the body.
    if (k && !skip[k]) {
      skip[k] = true;
      blocks.push({ id: nid(), type: ledeDone ? "body" : "dropcap", html: paras[i] });
      ledeDone = true;
    }
    emitAfter(i);
  }
  ins.filter((o) => (o.after | 0) >= paras.length).forEach(emit);

  return { blocks, counts };
}
