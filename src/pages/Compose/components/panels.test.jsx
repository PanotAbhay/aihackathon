import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { TEMPLATES } from "../../../data/index.js";
import { ElementsPanel } from "./ElementsPanel.jsx";
import { FormatToolbar } from "./FormatToolbar.jsx";

describe("ElementsPanel", () => {
  const panel = (key) => render(<ElementsPanel open allowed={TEMPLATES[key].blocks} onInsert={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} />);

  it("offers code and the structure group in the Lab manual only", () => {
    const { container, unmount } = panel("lab");
    expect(screen.getByText("Code listing")).toBeTruthy();
    expect(screen.getByText("STRUCTURE")).toBeTruthy();
    ["Chapter", "Appendix", "Contents"].forEach((label) => expect(screen.getByText(label)).toBeTruthy());
    expect(container.textContent).toContain("Code listing");
    unmount();

    ["latex", "news"].forEach((key) => {
      const { container: other, unmount: done } = panel(key);
      expect(other.textContent).not.toContain("Code listing");
      expect(other.textContent).not.toContain("STRUCTURE");
      done();
    });
  });

  it("filters by search and inserts on click", () => {
    const onInsert = vi.fn();
    const { container } = render(<ElementsPanel open allowed={TEMPLATES.lab.blocks} onInsert={onInsert} onDragStart={vi.fn()} onDragEnd={vi.fn()} />);
    fireEvent.change(container.querySelector("input"), { target: { value: "appendix" } });
    const items = container.querySelectorAll(".elements-item");
    expect(items).toHaveLength(1);
    fireEvent.click(within(items[0]).getByText("Appendix"));
    expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({ type: "appendix" }));
  });
});

describe("FormatToolbar", () => {
  afterEach(() => vi.restoreAllMocks());

  it("wraps the selection as escaped inline code", () => {
    const exec = vi.spyOn(document, "execCommand").mockReturnValue(true);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "a < b" });
    render(<FormatToolbar bar={{ x: 100, y: 100 }} zoom={1} />);
    fireEvent.click(screen.getByTitle("Inline code"));
    expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("<code"));
    expect(exec.mock.calls[0][2]).toContain("a &lt; b");
  });

  it("does nothing without a selection", () => {
    const exec = vi.spyOn(document, "execCommand").mockReturnValue(true);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "" });
    render(<FormatToolbar bar={{ x: 0, y: 0 }} zoom={1} />);
    fireEvent.click(screen.getByTitle("Inline code"));
    expect(exec).not.toHaveBeenCalled();
  });
});
