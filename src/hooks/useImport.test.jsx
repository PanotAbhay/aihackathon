import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TEMPLATES } from "../data/index.js";
import { useImport } from "./useImport.js";

function setup(templateKey = "lab", aiReply = null) {
  const save = vi.fn();
  const flash = vi.fn();
  const setBusy = vi.fn();
  const setNoteErr = vi.fn();
  const aiConfig = { provider: "builtin", model: "test" };
  if (aiReply != null) window.claude = { complete: vi.fn().mockResolvedValue(aiReply) };
  const hook = renderHook(() => useImport({ busy: false, setBusy, save, flash, setNoteErr, aiConfig, template: TEMPLATES[templateKey] }));
  return { hook, save, flash, setBusy };
}

const MANUAL = [
  "# Database Lab Manual",
  "[[toc]]",
  "# Chapter 1: Introduction",
  "## 1.1 Tools",
  "These are the tools.",
  "• MySQL",
  "• Oracle",
  "Listing 1.1: setup",
  "```sql",
  "CREATE TABLE emp (id INT);",
  "",
  "SELECT * FROM emp;",
  "```",
  "# Appendix A: Scripts",
].join("\n\n").replace("```sql\n\nCREATE", "```sql\nCREATE").replace(";\n\n\n\nSELECT", ";\n\nSELECT").replace("emp;\n\n```", "emp;\n```");

describe("useImport", () => {
  it("imports marked text as plain text into Lab manual blocks", () => {
    const { hook, save } = setup("lab");
    act(() => hook.result.current.setRaw(MANUAL));
    act(() => hook.result.current.importPlain());
    const blocks = save.mock.calls[0][0];
    expect(blocks.map((b) => b.type)).toEqual(["h1", "standfirst", "byline", "toc", "chapter", "h2", "body", "bullets", "code", "appendix"]);
    expect(blocks[0].html).toBe("Database Lab Manual");
    expect(blocks.find((b) => b.type === "code")).toMatchObject({ a: "setup", text: "CREATE TABLE emp (id INT);\n\nSELECT * FROM emp;" });
  });

  it("imports the same text into the news template with its own blocks", () => {
    const { hook, save } = setup("news");
    act(() => hook.result.current.setRaw(MANUAL));
    act(() => hook.result.current.importPlain());
    const types = save.mock.calls[0][0].map((b) => b.type);
    expect(types).not.toContain("chapter");
    expect(types).not.toContain("code");
    expect(types).not.toContain("toc");
    expect(types).toContain("h2");
  });

  it("refuses to import less than two paragraphs", () => {
    const { hook, save } = setup("lab");
    act(() => hook.result.current.setRaw("Only a title"));
    act(() => hook.result.current.importPlain());
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.importNote).toMatch(/PASTE AN ARTICLE/);
  });

  it("sends code to the AI as a summary and still imports it verbatim", async () => {
    const reply = JSON.stringify({ headline: "Database Lab Manual", standfirst: "", author: "QMUL", insertions: [{ after: 4, type: "nutshell", title: "Safety", items: ["Back up first."] }] });
    const { hook, save } = setup("lab", reply);
    act(() => hook.result.current.setRaw(MANUAL));
    await act(async () => { await hook.result.current.importAi(); });
    const [{ messages, max_tokens }] = window.claude.complete.mock.calls[0];
    expect(max_tokens).toBe(16000);
    expect(messages[0].content).toContain("```sql (3 lines of code)```");
    expect(messages[0].content).not.toContain("CREATE TABLE");
    const blocks = save.mock.calls[0][0];
    expect(blocks.find((b) => b.type === "code").text).toContain("CREATE TABLE emp");
    expect(blocks.map((b) => b.type)).toContain("nutshell");
    delete window.claude;
  });

  it("explains a reply that isn't a plan, and logs it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { hook, save } = setup("lab", "Sorry, I can't format that.");
    act(() => hook.result.current.setRaw(MANUAL));
    await act(async () => { await hook.result.current.importAi(); });
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.importNote).toMatch(/WASN’T A LAYOUT PLAN/);
    expect(error.mock.calls.some((c) => String(c[1]).includes("Sorry"))).toBe(true);
    delete window.claude;
  });

  it("explains an empty reply", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { hook, save } = setup("lab", "");
    act(() => hook.result.current.setRaw(MANUAL));
    await act(async () => { await hook.result.current.importAi(); });
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.importNote).toMatch(/SENT BACK NOTHING/);
    delete window.claude;
  });

  it("builds the page from a plan cut off part-way", async () => {
    const { hook, save } = setup("lab", '{"headline":"Database Lab Manual","insertions":[{"after":4,"type":"nutshell","title":"Safety","items":["Back up first."]},{"after":6,"type":"h2","text":"Cut of');
    act(() => hook.result.current.setRaw(MANUAL));
    await act(async () => { await hook.result.current.importAi(); });
    const blocks = save.mock.calls[0][0];
    expect(blocks.map((b) => b.type)).toContain("nutshell");
    expect(blocks.map((b) => b.type)).toContain("chapter");
    delete window.claude;
  });
});
