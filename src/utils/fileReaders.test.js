// @vitest-environment node
// Node, so pdfText skips cutting pictures out (that needs a canvas) but still marks where they are.
import { describe, it, expect, beforeAll, vi } from "vitest";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfText } from "./fileReaders.js";
import { plainParas } from "./blocks.js";

// A tiny PDF writer: each page is a list of { font, size, x, y, text } lines (fonts are the
// standard Helvetica, Helvetica-Bold and Courier) plus optional images { x, y, w, h }.
const FONTS = { body: "Helvetica", bold: "Helvetica-Bold", mono: "Courier" };

function pdfString(s) {
  return "(" + s.replace(/[\\()]/g, (c) => "\\" + c) + ")";
}

function makePdf(pages) {
  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const catalog = add("");
  const tree = add("");
  const fontIds = Object.fromEntries(Object.entries(FONTS).map(([k, name]) => [k, add("<< /Type /Font /Subtype /Type1 /BaseFont /" + name + " /Encoding /WinAnsiEncoding >>")]));
  const image = add("<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceGray /BitsPerComponent 8 /Length 4 >>\nstream\n\u0000ÿÿ\u0000\nendstream");
  const kids = pages.map((page) => {
    const ops = page.lines.map((l) => "BT /" + l.font + " " + l.size + " Tf 1 0 0 1 " + l.x + " " + l.y + " Tm " + pdfString(l.text) + " Tj ET");
    (page.images || []).forEach((im) => ops.push("q " + im.w + " 0 0 " + im.h + " " + im.x + " " + im.y + " cm /Im1 Do Q"));
    const stream = ops.join("\n");
    const content = add("<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream");
    const fonts = Object.entries(fontIds).map(([k, id]) => "/" + k + " " + id + " 0 R").join(" ");
    return add("<< /Type /Page /Parent " + tree + " 0 R /MediaBox [0 0 595 842] /Resources << /Font << " + fonts + " >> /XObject << /Im1 " + image + " 0 R >> >> /Contents " + content + " 0 R >>");
  });
  objects[catalog - 1] = "<< /Type /Catalog /Pages " + tree + " 0 R >>";
  objects[tree - 1] = "<< /Type /Pages /Kids [" + kids.map((k) => k + " 0 R").join(" ") + "] /Count " + kids.length + " >>";

  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const at = out.length;
    out += (i + 1) + " 0 obj\n" + body + "\nendobj\n";
    return at;
  });
  const xref = out.length;
  out += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n" + offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += "trailer\n<< /Size " + (objects.length + 1) + " /Root " + catalog + " 0 R >>\nstartxref\n" + xref + "\n%%EOF";
  return Uint8Array.from(out, (c) => c.charCodeAt(0));
}

const body = (y, text, x = 72) => ({ font: "body", size: 10, x, y, text });
const folio = (n) => ({ font: "body", size: 10, x: 297, y: 40, text: String(n) });

const PAGES = [
  // 1: title page with a logo
  { lines: [{ font: "bold", size: 20.7, x: 72, y: 600, text: "Database Systems" }, { font: "bold", size: 20.7, x: 72, y: 575, text: "Lab Manual" }, body(540, "School of Computing"), folio(1)], images: [{ x: 72, y: 650, w: 120, h: 80 }] },
  // 2: contents
  { lines: [{ font: "bold", size: 24.8, x: 72, y: 760, text: "Contents" }, { font: "bold", size: 10, x: 72, y: 720, text: "1 Introduction 3" }, body(706, "1.1 Tools . . . . . . . . 3", 87), body(692, "1.2 Setup . . . . . . . . 4", 87), { font: "bold", size: 10, x: 72, y: 670, text: "A Scripts 5" }, folio(2)] },
  // 3: chapter with a heading, bold lead-in, inline code and a figure
  {
    lines: [
      { font: "bold", size: 20.7, x: 72, y: 760, text: "Chapter 1" },
      { font: "bold", size: 24.8, x: 72, y: 730, text: "Introduction" },
      { font: "bold", size: 14.3, x: 72, y: 690, text: "1.1 Tools" },
      body(665, "These are the tools used in the lab exercises of this course and they are free."),
      { font: "bold", size: 10, x: 72, y: 640, text: "Step-1" },
      { font: "body", size: 10, x: 102.56, y: 640, text: ": Open the terminal and type" },
      { font: "mono", size: 10, x: 250, y: 640, text: "mysql -u root" },
      { font: "body", size: 10, x: 330, y: 640, text: " to connect." },
      body(400, "Figure 1.1: The home page", 230),
      folio(3),
    ],
    images: [{ x: 100, y: 420, w: 300, h: 200 }],
  },
  // 4: a numbered SQL listing in fixed columns, with a blank numbered line
  {
    lines: [
      body(760, "Listing 1.1: tables.sql", 200),
      { font: "body", size: 5, x: 60, y: 740, text: "1" }, { font: "mono", size: 9, x: 80, y: 740, text: "CREATE" }, { font: "mono", size: 9, x: 118, y: 740, text: "TABLE" }, { font: "mono", size: 9, x: 151, y: 740, text: "emp" },
      { font: "body", size: 5, x: 60, y: 729, text: "2" }, { font: "mono", size: 9, x: 80, y: 729, text: "(" }, { font: "mono", size: 9, x: 91, y: 729, text: "id" }, { font: "mono", size: 9, x: 108, y: 729, text: "INT);" },
      { font: "body", size: 5, x: 60, y: 718, text: "3" },
      { font: "body", size: 5, x: 60, y: 707, text: "4" }, { font: "mono", size: 9, x: 80, y: 707, text: "SELECT" }, { font: "mono", size: 9, x: 118, y: 707, text: "'a b'" }, { font: "mono", size: 9, x: 151, y: 707, text: "FROM" }, { font: "mono", size: 9, x: 178, y: 707, text: "emp;" },
      body(680, "That is the whole script."),
      folio(4),
    ],
  },
  // 5: appendix
  { lines: [{ font: "bold", size: 20.7, x: 72, y: 760, text: "Appendix A" }, { font: "bold", size: 24.8, x: 72, y: 730, text: "Scripts" }, { font: "bold", size: 12, x: 72, y: 690, text: "A.1 Oracle version" }, body(665, "Use the Oracle script."), folio(5)] },
];

// pdf.js warns that it has no font files for the standard fonts (text extraction doesn't need
// them) and about the deliberately damaged file below.
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

let result;
beforeAll(async () => {
  result = await pdfText(pdfjs, makePdf(PAGES));
});

// Split the way the import does, so code fences keep their blank lines.
const paras = () => plainParas(result.text);

describe("pdfText structure", () => {
  it("finds the title and keeps the logo before it", () => {
    expect(paras()[0]).toBe("[[image 0]]");
    expect(paras()).toContain("# Database Systems Lab Manual");
  });

  it("replaces the contents page with one [[toc]] marker", () => {
    expect(paras().filter((p) => p === "[[toc]]")).toHaveLength(1);
    expect(result.text).not.toMatch(/Tools \. \./);
    expect(result.text).not.toContain("A Scripts 5");
  });

  it("marks chapters, appendices and headings", () => {
    expect(paras()).toContain("# Chapter 1: Introduction");
    expect(paras()).toContain("# Appendix A: Scripts");
    expect(paras()).toContain("## 1.1 Tools");
    expect(paras()).toContain("### A.1 Oracle version");
  });

  it("keeps bold lead-ins and inline typewriter text", () => {
    expect(result.text).toContain("**Step-1**: Open the terminal and type `mysql -u root` to connect.");
  });

  it("places a figure before its caption", () => {
    const p = paras();
    expect(p[p.indexOf("Figure 1.1: The home page") - 1]).toBe("[[image 1]]");
  });

  it("rebuilds the listing without line numbers, keeping its blank line", () => {
    const fence = paras().find((p) => p.startsWith("```"));
    expect(fence).toBe("```sql\nCREATE TABLE emp\n( id INT);\n\nSELECT 'a b' FROM emp;\n```");
    expect(paras()[paras().indexOf(fence) - 1]).toBe("Listing 1.1: tables.sql");
  });

  it("drops page numbers", () => {
    expect(paras().some((p) => /^\d+$/.test(p))).toBe(false);
  });

  it("returns one picture slot per marker (empty without a canvas)", () => {
    expect(result.images).toEqual(["", ""]);
  });
});

describe("pdfText errors", () => {
  it("reports a damaged file", async () => {
    await expect(pdfText(pdfjs, Uint8Array.from("not a pdf", (c) => c.charCodeAt(0)))).rejects.toThrow(/damaged/);
  });

  it("returns empty text for a PDF with no text", async () => {
    const { text, images } = await pdfText(pdfjs, makePdf([{ lines: [] }]));
    expect(text).toBe("");
    expect(images).toEqual([]);
  });
});
