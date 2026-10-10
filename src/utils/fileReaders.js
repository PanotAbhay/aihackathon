async function inflate(bytes, raw) {
  const ds = new DecompressionStream(raw ? "deflate-raw" : "deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function latin1(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return s;
}

// .docx is a zip; pull word/document.xml straight out of it.
export async function readDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a valid .docx file");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  let entry = null;
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const cmtLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = latin1(buf.subarray(p + 46, p + 46 + nameLen));
    if (name === "word/document.xml") { entry = { method, compSize, local }; break; }
    p += 46 + nameLen + extraLen + cmtLen;
  }
  if (!entry) throw new Error("No document found inside the .docx");

  const lNameLen = dv.getUint16(entry.local + 26, true);
  const lExtraLen = dv.getUint16(entry.local + 28, true);
  const start = entry.local + 30 + lNameLen + lExtraLen;
  const raw = buf.subarray(start, start + entry.compSize);
  const bytes = entry.method === 8 ? await inflate(raw, true) : raw;
  const xml = new TextDecoder("utf-8").decode(bytes);

  const paras = [];
  const re = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  while ((m = re.exec(xml))) {
    const body = m[1].replace(/<w:tab\b[^>]*\/>/g, " ").replace(/<w:br\b[^>]*\/>/g, " ");
    let t = "";
    const tr = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
    let tm;
    while ((tm = tr.exec(body))) t += tm[1];
    t = t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\s+/g, " ").trim();
    if (t) paras.push(t);
  }
  if (!paras.length) throw new Error("That .docx had no readable text");
  return paras.join("\n\n");
}

// pdf.js is fetched on the first PDF import only. It follows the page tree, so pages
// come out in order; maps glyphs through each font's encoding (ligatures, CID fonts);
// and never treats image or font data as text. The legacy build carries polyfills for
// the newer JS it relies on (Map#getOrInsert, Math.sumPrecise…), which Safari lacks.
async function loadPdfJs() {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

// page.getTextContent() reads its stream with `for await`, which Safari can't do on a
// ReadableStream ("undefined is not a function"), so read the chunks by hand.
async function textItems(page) {
  const reader = page.streamTextContent().getReader();
  const items = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return items;
    items.push(...value.items);
  }
}

// One page's text items grouped into lines, each with its start x, baseline and font height.
function pageLines(items) {
  const lines = [];
  let line = null;
  for (const item of items) {
    if (typeof item.str !== "string") continue;
    if (item.str.trim()) {
      const h = Math.abs(item.transform[3]) || item.height || 0;
      if (!line) line = { text: "", x: item.transform[4], y: item.transform[5], h };
      line.h = Math.max(line.h, h);
    }
    if (line) line.text += item.str;
    if (item.hasEOL && line) { lines.push(line); line = null; }
  }
  if (line) lines.push(line);
  return lines
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() }))
    .filter((l) => l.text);
}

// Lines on most pages (running heads, page footers) differ only in their page number.
const repeatKey = (text) => text.replace(/\d+/g, "#");

function dropRunningLines(pages) {
  if (pages.length < 3) return pages;
  const seen = new Map();
  for (const lines of pages) {
    for (const key of new Set(lines.map((l) => repeatKey(l.text)))) seen.set(key, (seen.get(key) || 0) + 1);
  }
  const limit = Math.ceil(pages.length * 0.6);
  return pages.map((lines) => lines.filter((l) => seen.get(repeatKey(l.text)) < limit));
}

// Bullets and "i." / "2." style list items; their wrapped lines hang indented.
const LIST_ITEM = /^([•▪◦‣]|\(?[ivx]{1,4}[.)]|\d{1,2}[.)])\s/;
const ENDS_SENTENCE = /[.:;!?”")\]]$/;

// Whether line `l` starts a new paragraph after `prev`.
function startsParagraph(prev, l) {
  const h = Math.max(prev.h, l.h);
  const drop = prev.y - l.y;
  if (Math.abs(prev.h - l.h) > h * 0.1) return true; // heading ↔ body, title ↔ byline
  if (LIST_ITEM.test(l.text)) return true;
  // Jumped up to a new column or region: carry on only mid-sentence.
  if (drop < -h) return ENDS_SENTENCE.test(prev.text);
  if (drop > h * 1.7) return true; // blank space between blocks
  const indent = l.x - prev.x;
  if (LIST_ITEM.test(prev.text)) return false; // hanging indent under a list item
  return indent > h * 0.8 && indent < h * 6; // indented first line
}

// Lines inside a paragraph are joined, keeping a trailing hyphen attached ("drug-" + "resistant").
function pageText(lines) {
  let out = "";
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    if (prev) out += startsParagraph(prev, l) ? "\n\n" : /-$/.test(out) ? "" : " ";
    out += l.text;
  });
  return out;
}

// Plain text of a PDF given the bytes and a pdf.js module; split out from readPdf so it
// can run against pdf.js's Node build.
export async function pdfText(pdfjs, data) {
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    task.destroy();
    if (e && e.name === "PasswordException") throw new Error("That PDF is password-protected — remove the password and try again.");
    throw new Error("Couldn’t read that PDF — the file may be damaged.");
  }
  try {
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      pages.push(pageLines(await textItems(page)));
      page.cleanup();
    }
    // A sentence that runs over the page break stays one paragraph.
    return dropRunningLines(pages).map(pageText).filter(Boolean).reduce((all, page) => {
      if (!all) return page;
      const carry = !ENDS_SENTENCE.test(all) && /^[a-z(]/.test(page);
      return all + (carry ? (/-$/.test(all) ? "" : " ") : "\n\n") + page;
    }, "");
  } finally {
    task.destroy();
  }
}

export async function readPdf(file) {
  const pdfjs = await loadPdfJs();
  const clean = (await pdfText(pdfjs, new Uint8Array(await file.arrayBuffer()))).trim();
  // A short PDF is not a scanned one. Only fall back to AI when there is
  // essentially no text layer at all (a scan often yields a stray page number).
  if (clean.replace(/[\s\d.,\-]/g, "").length < 24) {
    const err = new Error("No text layer in that PDF");
    err.noTextLayer = true;
    throw err;
  }
  return clean;
}

export function pickFile(accept, onPick) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.onchange = () => {
    const f = input.files && input.files[0];
    if (f) onPick(f);
  };
  input.click();
}
