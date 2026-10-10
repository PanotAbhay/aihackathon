import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TEMPLATES } from "../../../data/index.js";
import { createStarterBlocks } from "../../../utils/blocks.js";
import { Canvas } from "./Canvas.jsx";

const BOOK = [
  { id: "h1", type: "h1", html: "Lab Manual" },
  { id: "sf", type: "standfirst", html: "" },
  { id: "by", type: "byline", a: "QMUL", b: "EECS" },
  { id: "toc", type: "toc", a: "Contents" },
  { id: "c1", type: "chapter", html: "Introduction" },
  { id: "p1", type: "body", html: "Text." },
  { id: "s1", type: "h2", html: "Tools" },
  { id: "code", type: "code", lang: "sql", a: "", text: "SELECT 1;" },
  { id: "c2", type: "chapter", html: "Joins" },
  { id: "s2", type: "h2", html: "Inner joins" },
  { id: "f1", type: "image", slots: [""], a: "A figure", b: "" },
  { id: "a1", type: "appendix", html: "Scripts" },
  { id: "a2", type: "appendix", html: "Answers" },
];

function canvas(blocks, { template = "lab", layout = "web" } = {}) {
  const t = TEMPLATES[template];
  return render(
    <Canvas
      blocks={blocks}
      sel={null}
      building={[]}
      look={t.look}
      theme={t.theme}
      layout={layout}
      zoom={1}
      allowed={t.blocks}
      drop={{ index: -1, line: null }}
      readTime={3}
      onClearSel={vi.fn()}
      onSelect={vi.fn()}
      onCaret={vi.fn()}
      onPatch={vi.fn()}
      onDelete={vi.fn()}
      onDeleteSection={vi.fn()}
      onDuplicate={vi.fn()}
      onCommitProse={vi.fn()}
      onShowDrop={vi.fn()}
      onDropAt={vi.fn()}
      onMoveStart={vi.fn()}
      onDragEnd={vi.fn()}
      onNotice={vi.fn()}
    />,
  );
}

const pageOf = (container, id) => {
  const pages = Array.from(container.querySelectorAll("[data-page]"));
  return pages.findIndex((p) => p.querySelector('[data-unit="' + id + '"]')) + 1;
};

describe("Canvas", () => {
  it("numbers chapters and letters appendices", () => {
    canvas(BOOK);
    expect(screen.getByText("Chapter 1")).toBeTruthy();
    expect(screen.getByText("Chapter 2")).toBeTruthy();
    expect(screen.getByText("Appendix A")).toBeTruthy();
    expect(screen.getByText("Appendix B")).toBeTruthy();
  });

  it("fills the contents from the chapters and headings", () => {
    const { container } = canvas(BOOK);
    const rows = Array.from(container.querySelectorAll('[data-split="toc"] [data-split-lines] > div')).map((r) => r.textContent);
    expect(rows).toEqual(["1Introduction", "Tools", "2Joins", "Inner joins", "AScripts", "BAnswers"]);
  });

  it("starts every chapter, appendix and the contents on a new A4 page", () => {
    const { container } = canvas(BOOK, { layout: "print-1" });
    expect(container.querySelectorAll("[data-page]").length).toBe(6);
    expect(pageOf(container, "toc")).toBe(2);
    expect(pageOf(container, "c1")).toBe(3);
    expect(pageOf(container, "c2")).toBe(4);
    expect(pageOf(container, "a1")).toBe(5);
    expect(pageOf(container, "a2")).toBe(6);
  });

  it("gives the contents page numbers in print layouts", () => {
    const { container } = canvas(BOOK, { layout: "print-1" });
    const first = container.querySelector('[data-split="toc"] [data-split-lines] > div');
    expect(first.textContent).toBe("1Introduction3");
  });

  it("doesn't force pages for a contents block in an article without chapters", () => {
    const blocks = [{ id: "h1", type: "h1", html: "T" }, { id: "toc", type: "toc", a: "Contents" }, { id: "s", type: "h2", html: "Method" }];
    const { container } = canvas(blocks, { layout: "print-1" });
    expect(container.querySelectorAll("[data-page]").length).toBe(1);
  });

  it("renders every template's starter page in every layout", () => {
    Object.keys(TEMPLATES).forEach((key) => {
      ["web", "print-1", "print-2"].forEach((layout) => {
        const { container, unmount } = canvas(createStarterBlocks(key), { template: key, layout });
        expect(container.querySelector("[data-article]")).toBeTruthy();
        unmount();
      });
    });
  });

  it("renders an empty document", () => {
    const { container } = canvas([], { layout: "print-2" });
    expect(container.querySelectorAll("[data-page]").length).toBe(1);
  });
});
