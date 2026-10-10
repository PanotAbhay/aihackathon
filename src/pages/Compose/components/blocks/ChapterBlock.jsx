import { EditableText } from "./EditableText.jsx";

export const CHAPTER_LABEL = {
  fontFamily: "var(--h2-font, var(--font-sans))",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--muted)",
  margin: "0 0 10px",
};

// Set like the headline: chapters are the largest headings inside the document.
export const CHAPTER_TITLE = {
  fontFamily: "var(--h1-font, var(--font-serif))",
  fontSize: "var(--h1-size, var(--serif-display))",
  fontWeight: "var(--h1-weight, 600)",
  lineHeight: "var(--h1-lh, 1.1)",
  letterSpacing: "var(--h1-ls, var(--serif-display-ls))",
  color: "var(--ink)",
  margin: 0,
  textWrap: "balance",
};

// "Chapter 2" / "Appendix A" over the title. Numbered automatically; opens a new page in print layouts.
export function ChapterBlock({ block, theme, number, onPatch }) {
  const t = theme.chapter || {};
  const word = block.type === "appendix" ? "Appendix" : "Chapter";
  return (
    <div style={{ margin: "8px 0 36px", ...t.wrap }}>
      <div style={{ ...CHAPTER_LABEL, ...t.label }}>{word} {number}</div>
      <EditableText
        as="h1"
        html
        data-ph={word + " title"}
        value={block.html}
        onCommit={(v) => onPatch((x) => { x.html = v; })}
        style={{ ...CHAPTER_TITLE, ...t.title }}
      />
    </div>
  );
}
