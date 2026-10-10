import { describe, it, expect } from "vitest";
import { planPages, A4 } from "./pagination.js";

const ROOM = A4.height - A4.margin * 2 - 16; // page body minus SAFETY
const ids = (column) => column.map((it) => (typeof it === "string" ? it : it.id));
const plan = (units, opts = {}) => planPages(units, { columns: 1, mastheadCount: 0, ...opts });

describe("planPages", () => {
  it("puts short blocks on one page", () => {
    const pages = plan([{ id: "a", height: 100 }, { id: "b", height: 100 }]);
    expect(pages).toHaveLength(1);
    expect(ids(pages[0].columns[0])).toEqual(["a", "b"]);
  });

  it("returns one empty page for an empty document", () => {
    const pages = plan([]);
    expect(pages).toHaveLength(1);
    expect(pages[0].columns[0]).toEqual([]);
  });

  it("keeps the masthead across the top of page 1", () => {
    const pages = plan([{ id: "h1", height: 80 }, { id: "p", height: 50 }], { mastheadCount: 1, columns: 2 });
    expect(pages[0].masthead).toEqual(["h1"]);
    expect(ids(pages[0].columns[0])).toEqual(["p"]);
  });

  it("moves a block that doesn't fit to the next page", () => {
    const pages = plan([{ id: "a", height: ROOM - 50 }, { id: "b", height: 100 }]);
    expect(pages).toHaveLength(2);
    expect(ids(pages[1].columns[0])).toEqual(["b"]);
  });

  it("lets a block taller than a page run on rather than loop", () => {
    const pages = plan([{ id: "a", height: ROOM * 3 }]);
    expect(pages).toHaveLength(1);
  });

  it("splits a paragraph at a line break with at least two lines each side", () => {
    const lineHeight = 20;
    const pages = plan([{ id: "x", height: ROOM - 30 }, { id: "p", height: 200, textHeight: 200, lineHeight }]);
    // only one line would fit after x: the whole paragraph moves
    expect(ids(pages[1].columns[0])).toEqual(["p"]);

    const split = plan([{ id: "x", height: ROOM - 100 }, { id: "p", height: 200, textHeight: 200, lineHeight }]);
    expect(split).toHaveLength(2);
    const head = split[0].columns[0][1];
    const tail = split[1].columns[0][0];
    expect(head.show % lineHeight).toBe(0);
    expect(head.show / lineHeight).toBeGreaterThanOrEqual(2);
    expect(tail.skip).toBe(head.show);
  });

  it("keeps a heading with the start of what follows", () => {
    const pages = plan([{ id: "x", height: ROOM - 60 }, { id: "h", height: 40, keepWithNext: true }, { id: "y", height: 200 }]);
    expect(ids(pages[0].columns[0])).toEqual(["x"]);
    expect(ids(pages[1].columns[0])).toEqual(["h", "y"]);
  });

  it("floats a figure that doesn't fit past the following text", () => {
    const pages = plan([{ id: "x", height: ROOM - 100 }, { id: "fig", height: 300, float: true }, { id: "p", height: 60 }]);
    expect(ids(pages[0].columns[0])).toEqual(["x", "p"]);
    expect(ids(pages[1].columns[0])).toEqual(["fig"]);
  });

  describe("page breaks (chapters)", () => {
    it("starts a chapter on a new page", () => {
      const pages = plan([{ id: "a", height: 100 }, { id: "ch", height: 80, pageBreak: true }, { id: "b", height: 100 }]);
      expect(pages).toHaveLength(2);
      expect(ids(pages[1].columns[0])).toEqual(["ch", "b"]);
    });

    it("doesn't leave a blank page when the chapter opens the document", () => {
      const pages = plan([{ id: "ch", height: 80, pageBreak: true }, { id: "b", height: 100 }]);
      expect(pages).toHaveLength(1);
    });

    it("gives the title page to the masthead", () => {
      const pages = plan([{ id: "h1", height: 80 }, { id: "toc", height: 200, pageBreak: true }], { mastheadCount: 1 });
      expect(pages).toHaveLength(2);
      expect(pages[0].masthead).toEqual(["h1"]);
      expect(ids(pages[1].columns[0])).toEqual(["toc"]);
    });

    it("places waiting figures before the chapter, like \\clearpage", () => {
      const pages = plan([
        { id: "x", height: ROOM - 100 },
        { id: "fig", height: 300, float: true },
        { id: "p", height: 40 },
        { id: "ch", height: 80, pageBreak: true },
      ]);
      expect(ids(pages[1].columns[0])).toEqual(["fig"]);
      expect(ids(pages[2].columns[0])).toEqual(["ch"]);
    });

    it("breaks consecutive chapters onto their own pages", () => {
      const pages = plan([{ id: "c1", height: 80, pageBreak: true }, { id: "c2", height: 80, pageBreak: true }, { id: "c3", height: 80, pageBreak: true }]);
      expect(pages.map((p) => ids(p.columns[0]))).toEqual([["c1"], ["c2"], ["c3"]]);
    });
  });

  describe("split blocks with a caption above their lines (code, contents)", () => {
    it("shows the caption and whole lines in the first slice", () => {
      const unit = { id: "code", height: 60 + 30 * 20 + 20, top: 60, textHeight: 30 * 20, lineHeight: 20 };
      const pages = plan([{ id: "x", height: ROOM - 300 }, unit]);
      const head = pages[0].columns[0][1];
      expect(head.id).toBe("code");
      expect((head.show - 60) % 20).toBe(0);
      expect(head.show).toBeLessThanOrEqual(300);
      expect(pages[1].columns[0][0]).toEqual({ id: "code", skip: head.show });
    });

    it("moves the whole block when the caption leaves no room for two lines", () => {
      const unit = { id: "code", height: 60 + 30 * 20, top: 60, textHeight: 30 * 20, lineHeight: 20 };
      const pages = plan([{ id: "x", height: ROOM - 90 }, unit]);
      expect(ids(pages[0].columns[0])).toEqual(["x"]);
      expect(pages[1].columns[0][0]).toEqual({ id: "code" });
    });

    it("splits a listing longer than a page into several slices", () => {
      const lines = 150;
      const unit = { id: "code", height: 40 + lines * 20, top: 40, textHeight: lines * 20, lineHeight: 20 };
      const pages = plan([unit]);
      expect(pages.length).toBeGreaterThanOrEqual(3);
      const slices = pages.map((p) => p.columns[0][0]);
      // every slice carries on where the last stopped
      let shown = 0;
      slices.forEach((s) => {
        expect(s.skip || 0).toBe(shown);
        shown += s.show || 0;
      });
    });
  });

  it("fills both columns before the next page", () => {
    const pages = plan([{ id: "a", height: ROOM - 10 }, { id: "b", height: 100 }, { id: "c", height: ROOM - 10 }], { columns: 2 });
    expect(ids(pages[0].columns[0])).toEqual(["a"]);
    expect(ids(pages[0].columns[1])).toEqual(["b"]);
    expect(ids(pages[1].columns[0])).toEqual(["c"]);
  });
});
