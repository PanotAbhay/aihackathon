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

function pdfUnescape(s) {
  return s.replace(/\\(\d{1,3}|.)/g, (_, c) => {
    if (/^\d+$/.test(c)) return String.fromCharCode(parseInt(c, 8));
    if (c === "n" || c === "r") return "\n";
    if (c === "t") return " ";
    if (c === "b" || c === "f") return "";
    return c;
  });
}

async function decodeStream(chunk) {
  try {
    return new TextDecoder("latin1").decode(await inflate(chunk, false));
  } catch {
    try {
      return new TextDecoder("latin1").decode(await inflate(chunk, true));
    } catch {
      // Uncompressed content stream.
      const plain = latin1(chunk);
      return /(TJ|Tj)/.test(plain) ? plain : null;
    }
  }
}

export async function readPdf(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const s = latin1(buf);
  let out = "";
  let idx = 0;
  while (true) {
    const st = s.indexOf("stream", idx);
    if (st < 0) break;
    const en = s.indexOf("endstream", st);
    if (en < 0) break;
    let b = st + 6;
    if (s[b] === "\r") b++;
    if (s[b] === "\n") b++;
    let e2 = en;
    while (e2 > b && (buf[e2 - 1] === 10 || buf[e2 - 1] === 13)) e2--;
    idx = en + 9;
    // Images and embedded fonts are binary: a decoded screenshot is megabytes of
    // pixels that contain "Tj" by chance and would be read as text.
    if (/\/Subtype\s*\/(?!Form\b)|\/Length1\b/.test(s.slice(s.lastIndexOf("obj", st), st))) continue;
    const text = await decodeStream(buf.subarray(b, e2));
    if (!text || !/(TJ|Tj)/.test(text)) continue;

    let depth = 0;
    const re = /\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]+>|-?\d+(?:\.\d+)?|\[|\]|T\*|Td|TD|TJ|Tj|'|"/g;
    let m;
    while ((m = re.exec(text))) {
      const tok = m[0];
      if (tok === "[") { depth++; continue; }
      if (tok === "]") { depth--; continue; }
      if (tok[0] === "(") { out += pdfUnescape(tok.slice(1, -1)); continue; }
      if (tok[0] === "<") {
        const hex = tok.slice(1, -1).replace(/\s+/g, "");
        for (let i = 0; i + 1 < hex.length; i += 2) {
          const code = parseInt(hex.substr(i, 2), 16);
          if (code >= 32 || code === 10) out += String.fromCharCode(code);
        }
        continue;
      }
      if (depth > 0 && /^-?\d/.test(tok)) { if (parseFloat(tok) <= -120) out += " "; continue; }
      if (tok === "T*" || tok === "Td" || tok === "TD" || tok === "'" || tok === '"') out += "\n";
    }
    out += "\n";
  }
  const clean = out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
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
