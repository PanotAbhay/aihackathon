import { describe, it, expect } from "vitest";
import { rotatedLabels, labelOverhang, textEm } from "./plotLabels.js";

const rows = (...labels) => labels.map((label, i) => ({ label, value: i + 1 }));

describe("rotatedLabels", () => {
  it("rotates two long capitalised labels in a two-column page (the overlapping-labels bug)", () => {
    const r = rows("LIGHTWEIGHT MODEL", "RESNET-50 ENCODER");
    expect(rotatedLabels(r, { kind: "bar", columns: 2 })).toBe(true);
    expect(rotatedLabels(r, { kind: "bar", columns: 1 })).toBe(false);
  });

  it("keeps short labels flat", () => {
    expect(rotatedLabels(rows("A", "B", "C", "D"), { columns: 2 })).toBe(false);
    expect(rotatedLabels(rows("2023", "2024", "2025", "2026"), { kind: "line", columns: 2 })).toBe(false);
  });

  it("rotates many medium labels that only collide in numbers", () => {
    const many = rows("Mirpur", "Uttara", "Mohammadpur", "Gulshan", "Old Dhaka", "Dhanmondi");
    expect(rotatedLabels(many, { columns: 1 })).toBe(true);
  });

  it("handles no rows, one row and missing labels", () => {
    expect(rotatedLabels([], { columns: 2 })).toBe(false);
    expect(rotatedLabels(rows("Only"), { kind: "line", columns: 2 })).toBe(false);
    expect(rotatedLabels([{ value: 1 }, { label: null, value: 2 }], { columns: 2 })).toBe(false);
  });

  it("defaults to one column for an unknown column count", () => {
    const r = rows("LIGHTWEIGHT MODEL", "RESNET-50 ENCODER");
    expect(rotatedLabels(r, { columns: 7 })).toBe(rotatedLabels(r, { columns: 1 }));
    expect(rotatedLabels(r)).toBe(false);
  });
});

describe("textEm", () => {
  it("measures capitals wider than lower case and thin letters narrowest", () => {
    expect(textEm("MMM")).toBeGreaterThan(textEm("AAA"));
    expect(textEm("AAA")).toBeGreaterThan(textEm("aaa"));
    expect(textEm("aaa")).toBeGreaterThan(textEm("iii"));
    expect(textEm("")).toBe(0);
    expect(textEm(undefined)).toBe(0);
  });
});

describe("labelOverhang", () => {
  it("narrows the plot when the first rotated label would hang past the column", () => {
    const r = rows("LIGHTWEIGHT MODEL", "RESNET-50 ENCODER");
    expect(labelOverhang(r, { columns: 2 })).toBeGreaterThan(0);
    expect(labelOverhang(r, { columns: 1 })).toBe(0); // not rotated
  });

  it("needs no room when the long label isn't first", () => {
    expect(labelOverhang(rows("A", "B", "C", "A VERY LONG LABEL INDEED"), { columns: 2 })).toBe(0);
  });

  it("is zero for no rows", () => {
    expect(labelOverhang([], { columns: 2 })).toBe(0);
  });
});
