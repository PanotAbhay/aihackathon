import { describe, it, expect } from "vitest";
import { highlightLines, guessLang, CODE_COLORS } from "./highlight.js";

const text = (lines) => lines.map((runs) => runs.map((r) => r.text).join(""));
const colorOf = (lines, word) => lines.flat().find((r) => r.text === word)?.color ?? null;

describe("highlightLines", () => {
  it("keeps every character and line", () => {
    const src = "SELECT a, 'x'\n\n-- note\nFROM t;";
    expect(text(highlightLines(src, "sql")).join("\n")).toBe(src);
    expect(text(highlightLines(src, "text")).join("\n")).toBe(src);
  });

  it("colours SQL keywords case-insensitively, strings and comments", () => {
    const lines = highlightLines("select ename FROM emp WHERE job = 'CLERK'; -- clerks", "sql");
    expect(colorOf(lines, "select")).toBe(CODE_COLORS.keyword);
    expect(colorOf(lines, "FROM")).toBe(CODE_COLORS.keyword);
    expect(colorOf(lines, "ename")).toBeNull();
    expect(colorOf(lines, "'CLERK'")).toBe(CODE_COLORS.string);
    expect(colorOf(lines, "-- clerks")).toBe(CODE_COLORS.comment);
  });

  it("doesn't colour keywords inside strings or identifiers", () => {
    const lines = highlightLines("SELECT 'select from' AS selection", "sql");
    expect(colorOf(lines, "'select from'")).toBe(CODE_COLORS.string);
    expect(colorOf(lines, "selection")).toBeNull();
  });

  it("splits a block comment over several lines, coloured on each", () => {
    const lines = highlightLines("/* one\ntwo */ SELECT 1", "sql");
    expect(lines).toHaveLength(2);
    expect(lines[0][0]).toEqual({ text: "/* one", color: CODE_COLORS.comment });
    expect(lines[1][0]).toEqual({ text: "two */", color: CODE_COLORS.comment });
  });

  it("survives an unterminated string or comment", () => {
    expect(() => highlightLines("SELECT 'oops\nFROM t", "sql")).not.toThrow();
    expect(text(highlightLines("/* never closed\nSELECT", "sql"))).toEqual(["/* never closed", "SELECT"]);
  });

  it("leaves MySQL backtick identifiers plain", () => {
    expect(colorOf(highlightLines("USE `ecs740p`;", "sql"), "`ecs740p`")).toBeNull();
  });

  it("colours Python keywords case-sensitively and # comments", () => {
    const lines = highlightLines("def f(x):\n    return None  # nothing\nTrue", "python");
    expect(colorOf(lines, "def")).toBe(CODE_COLORS.keyword);
    expect(colorOf(lines, "None")).toBe(CODE_COLORS.keyword);
    expect(colorOf(lines, "# nothing")).toBe(CODE_COLORS.comment);
  });

  it("returns one empty line for empty or missing text", () => {
    expect(highlightLines("", "sql")).toEqual([[]]);
    expect(highlightLines(null, "sql")).toEqual([[]]);
    expect(highlightLines(undefined, "unknown")).toEqual([[]]);
  });
});

describe("guessLang", () => {
  it("recognises SQL, Python and anything else", () => {
    expect(guessLang("CREATE TABLE emp (id INT);")).toBe("sql");
    expect(guessLang("insert into emp values (1)")).toBe("sql");
    expect(guessLang("import os\nprint(os.name)")).toBe("python");
    expect(guessLang("sql> connect ecs740p;")).toBe("text");
    expect(guessLang("")).toBe("text");
  });
});
