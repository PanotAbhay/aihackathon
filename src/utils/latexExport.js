import { IMAGE_TYPES } from "../data/index.js";

const PREAMBLE = [
  "\\documentclass[11pt]{article}",
  "\\usepackage[T1]{fontenc}",
  "\\usepackage{lmodern}",
  "\\usepackage[a4paper,margin=1in]{geometry}",
  "\\usepackage{graphicx}",
  "\\usepackage{booktabs}",
  "\\usepackage{subcaption}",
  "\\usepackage{pgfplots}",
  "\\pgfplotsset{compat=1.18}",
  "\\usepackage{hyperref}",
].join("\n");

// Characters TeX treats specially, plus the Unicode the editor's fonts allow but pdfLaTeX rejects.
const TEX_ESCAPES = {
  "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "$": "\\$", "&": "\\&", "#": "\\#",
  "%": "\\%", "_": "\\_", "^": "\\textasciicircum{}", "~": "\\textasciitilde{}",
  "৳": "Tk ", "×": "$\\times$", "−": "$-$", "∗": "$\\ast$", "°": "\\textdegree{}", "²": "\\textsuperscript{2}",
  "³": "\\textsuperscript{3}", "±": "$\\pm$", "≈": "$\\approx$", "≤": "$\\leq$", "≥": "$\\geq$", "µ": "$\\mu$",
};

export function escapeTex(text) {
  return String(text == null ? "" : text).replace(/[\\{}$&#%_^~৳×−∗°²³±≈≤≥µ]/g, (ch) => TEX_ESCAPES[ch]);
}

// Inline editor HTML (bold, italic, links) → LaTeX. Uses the browser's parser.
function inlineNodes(nodes) {
  return Array.from(nodes).map((n) => {
    if (n.nodeType === 3) return escapeTex(n.nodeValue.replace(/\u00a0/g, " "));
    if (n.nodeType !== 1) return "";
    const inner = inlineNodes(n.childNodes);
    const tag = n.tagName.toLowerCase();
    if (tag === "b" || tag === "strong") return "\\textbf{" + inner + "}";
    if (tag === "i" || tag === "em") return "\\emph{" + inner + "}";
    if (tag === "a") return "\\href{" + escapeTex(n.getAttribute("href") || "") + "}{" + inner + "}";
    if (tag === "br") return "\\\\\n";
    return inner;
  }).join("");
}

function htmlToTex(html) {
  const doc = new DOMParser().parseFromString("<div>" + (html || "") + "</div>", "text/html");
  return inlineNodes(doc.body.firstChild.childNodes).trim();
}

function listItems(html) {
  const doc = new DOMParser().parseFromString("<ul>" + (html || "") + "</ul>", "text/html");
  const items = Array.from(doc.querySelectorAll("li")).map((li) => inlineNodes(li.childNodes).trim());
  return items.length ? items : [htmlToTex(html)];
}

function list(env, html) {
  return "\\begin{" + env + "}\n" + listItems(html).map((i) => "  \\item " + i).join("\n") + "\n\\end{" + env + "}";
}

function plotFigure(block, plot) {
  const bars = block.bars || [];
  const labels = bars.map((r) => "{" + escapeTex(r.label) + "}").join(",");
  const coords = bars.map((r, i) => "(" + (i + 1) + "," + (Number(r.value) || 0) + ")").join(" ");
  return [
    "\\begin{figure}[ht]",
    "  \\centering",
    "  \\begin{tikzpicture}",
    "    \\begin{axis}[" + plot.axis + ", width=0.85\\linewidth, height=6cm, xtick=data, xticklabels={" + labels + "}, ylabel={" + escapeTex(block.b) + "}, x tick label style={font=\\small}]",
    "      \\addplot" + plot.style + " coordinates {" + coords + "};",
    "    \\end{axis}",
    "  \\end{tikzpicture}",
    "  \\caption{" + escapeTex(block.a) + "}",
    "\\end{figure}",
  ].join("\n");
}

function dataUrlBytes(url) {
  const [meta, b64] = url.split(",");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = (meta.match(/image\/(png|jpe?g|gif|webp)/) || [, "png"])[1].replace("jpeg", "jpg");
  return { bytes, ext };
}

function imageFigure(block, figureIndex, images) {
  const slots = block.slots || [""];
  const width = slots.length === 1 ? "\\linewidth" : slots.length === 2 ? "0.48\\linewidth" : "0.31\\linewidth";
  const graphics = slots.map((src, k) => {
    if (!src || !src.startsWith("data:")) {
      return "\\fbox{\\parbox[c][4cm][c]{0.95\\linewidth}{\\centering Image placeholder}}";
    }
    const { bytes, ext } = dataUrlBytes(src);
    const name = "figures/figure" + figureIndex + (slots.length > 1 ? "-" + (k + 1) : "") + "." + ext;
    images.push({ name, data: bytes });
    return "\\includegraphics[width=\\linewidth]{" + name + "}";
  });

  const body = slots.length === 1
    ? "  " + graphics[0]
    : graphics.map((g) => "  \\begin{subfigure}{" + width + "}\n    \\centering\n    " + g + "\n  \\end{subfigure}").join("\\hfill\n");
  return ["\\begin{figure}[ht]", "  \\centering", body, "  \\caption{" + escapeTex(block.a) + "}", "\\end{figure}"].join("\n");
}

function table(block) {
  const rows = block.rows || [];
  if (!rows.length) return "";
  const cols = Math.max(...rows.map((r) => r.length));
  const line = (r) => "    " + Array.from({ length: cols }, (_, i) => escapeTex(r[i] || "")).join(" & ") + " \\\\";
  return [
    "\\begin{table}[ht]",
    "  \\centering",
    block.a ? "  \\caption{" + escapeTex(block.a) + "}" : "",
    "  \\begin{tabular}{" + "l".repeat(cols) + "}",
    "    \\toprule",
    line(rows[0]),
    "    \\midrule",
    ...rows.slice(1).map(line),
    "    \\bottomrule",
    "  \\end{tabular}",
    "\\end{table}",
  ].filter(Boolean).join("\n");
}

// Turn the document into a compilable article. Returns the .tex source and any embedded photos as files.
export function blocksToLatex(blocks) {
  const images = [];
  const front = { title: "", author: "", affiliation: "" };
  const body = [];
  let figures = 0;

  blocks.forEach((b) => {
    const t = b.type;
    if (t === "h1" && !front.title) { front.title = htmlToTex(b.html); return; }
    if (t === "byline" && !front.author) { front.author = escapeTex(b.a); front.affiliation = escapeTex(b.b); return; }
    if (t === "standfirst") { if (htmlToTex(b.html)) body.push("\\begin{abstract}\n" + htmlToTex(b.html) + "\n\\end{abstract}"); return; }
    if (t === "h1") body.push("\\section*{" + htmlToTex(b.html) + "}");
    else if (t === "h2") body.push("\\section{" + htmlToTex(b.html) + "}");
    else if (t === "h3") body.push("\\subsection{" + htmlToTex(b.html) + "}");
    else if (t === "body" || t === "dropcap") body.push(htmlToTex(b.html));
    else if (t === "bullets") body.push(list("itemize", b.html));
    else if (t === "numbered") body.push(list("enumerate", b.html));
    else if (t === "quote") body.push("\\begin{quote}\n" + escapeTex(b.a) + (b.b ? "\n\n\\hfill " + escapeTex(b.b) : "") + "\n\\end{quote}");
    else if (t === "byline") body.push("\\noindent\\textit{" + escapeTex([b.a, b.b].filter(Boolean).join(", ")) + "}");
    else if (t === "divider") body.push("\\begin{center}\n$\\ast$\\quad$\\ast$\\quad$\\ast$\n\\end{center}");
    else if (t === "nutshell") body.push("\\begin{center}\n\\fbox{\\parbox{0.92\\linewidth}{\n\\textbf{" + escapeTex(b.a) + "}\n" + list("itemize", b.html) + "\n}}\n\\end{center}");
    else if (t === "table") body.push(table(b));
    else if (t === "chart") { figures += 1; body.push(plotFigure(b, { axis: "ybar, ymin=0, nodes near coords, enlarge x limits=0.15", style: "[fill=blue!40, draw=blue!70!black]" })); }
    else if (t === "line") { figures += 1; body.push(plotFigure(b, { axis: "ymin=0", style: "[mark=*, smooth, thick, blue!70!black]" })); }
    else if (t === "poll") body.push(table({ a: b.a, rows: [["", escapeTex(b.b) || "Share"], ...(b.bars || []).map((r) => [r.label, r.value + "%"])] }));
    else if (t === "stats") body.push(table({ a: b.a, rows: [(b.cells || []).map((c) => c.label), (b.cells || []).map((c) => c.value)] }));
    else if (t === "timeline") body.push("\\begin{description}\n" + (b.rows || []).map((r) => "  \\item[" + escapeTex(r.d) + "] \\textbf{" + escapeTex(r.t) + "} " + escapeTex(r.x)).join("\n") + "\n\\end{description}");
    else if (IMAGE_TYPES.includes(t)) { figures += 1; body.push(imageFigure(b, figures, images)); }
  });

  const author = front.author ? front.author + (front.affiliation ? " \\\\ \\small " + front.affiliation : "") : "";
  const tex = [
    PREAMBLE,
    "",
    "\\title{" + front.title + "}",
    "\\author{" + author + "}",
    "\\date{\\today}",
    "",
    "\\begin{document}",
    "\\maketitle",
    "",
    body.filter(Boolean).join("\n\n"),
    "",
    "\\end{document}",
    "",
  ].join("\n");

  return { tex, images };
}

export function texFileName(blocks) {
  const h1 = blocks.find((b) => b.type === "h1");
  const slug = String(h1 ? h1.html : "").replace(/<[^>]*>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return slug || "article";
}
