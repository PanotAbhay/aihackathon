import { describe, it, expect } from "vitest";
import { blocksToLatex, escapeTex, texFileName } from "./latexExport.js";
import { createStarterBlocks } from "./blocks.js";

const doc = (...blocks) => [{ id: "h", type: "h1", html: "Title" }, ...blocks.map((b, i) => ({ id: "b" + i, ...b }))];
const LONG_LABELS = { type: "chart", a: "Speed", b: "relative speed", bars: [{ label: "LIGHTWEIGHT MODEL", value: 5 }, { label: "RESNET-50 ENCODER", value: 1 }] };

describe("escapeTex", () => {
  it("escapes TeX specials and writes Unicode the LaTeX way", () => {
    expect(escapeTex("50% & $5 #1 a_b {x} ~ ^")).toBe("50\\% \\& \\$5 \\#1 a\\_b \\{x\\} \\textasciitilde{} \\textasciicircum{}");
    expect(escapeTex("“quote” — 2–3 …")).toBe("``quote'' --- 2--3 \\ldots{}");
    expect(escapeTex("C:\\path")).toBe("C:\\textbackslash{}path");
    expect(escapeTex(null)).toBe("");
  });
});

describe("blocksToLatex", () => {
  it("converts inline bold, italic, code and links", () => {
    const { tex } = blocksToLatex(doc({ type: "body", html: '<b>B</b> <i>I</i> <code style="x">a_b</code> <a href="https://x.org/a_b">L</a>' }));
    expect(tex).toContain("\\textbf{B} \\emph{I} \\texttt{a\\_b} \\href{https://x.org/a\\_b}{L}");
  });

  it("rotates long tick labels in two columns only (overlapping labels)", () => {
    const two = blocksToLatex(doc(LONG_LABELS), { columns: 2 }).tex;
    const one = blocksToLatex(doc(LONG_LABELS), { columns: 1 }).tex;
    expect(two).toContain("\\documentclass[10pt,twocolumn]{article}");
    expect(two).toContain("rotate=45, anchor=east");
    expect(one).not.toContain("rotate=45");
  });

  it("writes a placeholder figure for a chart with no data", () => {
    const { tex } = blocksToLatex(doc({ type: "chart", a: "Empty", b: "", bars: [] }, { type: "line", a: "Empty line", b: "" }));
    expect(tex).not.toContain("coordinates {}");
    expect(tex.match(/No data/g)).toHaveLength(2);
    expect(tex).toContain("\\caption{Empty}");
  });

  it("treats non-numeric values as zero", () => {
    const { tex } = blocksToLatex(doc({ type: "chart", a: "c", b: "", bars: [{ label: "A", value: "n/a" }] }));
    expect(tex).toContain("(1,0)");
  });

  it("exports photos as files and empty slots as framed placeholders", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    const { tex, images } = blocksToLatex(doc({ type: "pair", slots: [png, ""], a: "Two photos" }));
    expect(images).toHaveLength(1);
    expect(images[0].name).toBe("figures/figure1-1.png");
    expect(tex).toContain("\\includegraphics[width=\\linewidth]{figures/figure1-1.png}");
    expect(tex).toContain("Image placeholder");
    expect(tex).toContain("\\begin{subfigure}");
  });

  it("pads ragged table rows", () => {
    const { tex } = blocksToLatex(doc({ type: "table", a: "T", rows: [["A", "B", "C"], ["1"]] }));
    expect(tex).toContain("    1 &  &  \\\\");
  });

  it("produces a balanced document for every LaTeX starter block", () => {
    const { tex } = blocksToLatex(createStarterBlocks("latex"), { columns: 2 });
    const begins = (tex.match(/\\begin\{/g) || []).length;
    const ends = (tex.match(/\\end\{/g) || []).length;
    expect(begins).toBe(ends);
    expect(tex.trim().endsWith("\\end{document}")).toBe(true);
  });
});

describe("texFileName", () => {
  it("slugs the headline and falls back to article", () => {
    expect(texFileName([{ type: "h1", html: "Rooftop <b>Solar</b> in Dhaka!" }])).toBe("rooftop-solar-in-dhaka");
    expect(texFileName([])).toBe("article");
  });
});
