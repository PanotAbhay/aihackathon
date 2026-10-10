import { CHAPTER_TYPES } from "../../../../data/index.js";
import { EditableText } from "./EditableText.jsx";
import { CHAPTER_TITLE } from "./ChapterBlock.jsx";
import { BODY_METRICS } from "./articleStyles.js";

const ENTRIES = { ...BODY_METRICS, color: "var(--ink-body)" };
// Dots run right to left so every row's leader ends at the same edge, as in LaTeX.
const LEADER = { flex: 1, minWidth: 24, overflow: "hidden", whiteSpace: "nowrap", direction: "rtl", margin: "0 6px", color: "var(--muted)" };
const PAGE = { flex: "0 0 auto", minWidth: "1.6em", textAlign: "right", fontVariantNumeric: "tabular-nums" };
const DOTS = " .".repeat(160);

// Contents built from the chapters and headings (`outline`, computed by the canvas). Page
// numbers appear in print layouts; a long contents splits across pages at a line break.
export function TocBlock({ block, theme, outline = [], slice, onPatch }) {
  const t = theme.toc || {};
  const chaptered = outline.some((o) => CHAPTER_TYPES.includes(o.type));
  const indent = chaptered ? { h2: 1.5, h3: 3.5 } : { h2: 0, h3: 1.5 };

  return (
    <div style={slice ? { overflow: "hidden", ...(slice.clip != null && { height: slice.clip }) } : undefined}>
      <div data-split={block.id} style={{ position: "relative", padding: "8px 0 28px", ...(slice && slice.skip && { marginTop: -slice.skip }) }}>
        <EditableText
          as="div"
          data-ph="Contents"
          value={block.a}
          onCommit={(v) => onPatch((x) => { x.a = v.trim(); })}
          style={{ ...CHAPTER_TITLE, margin: "0 0 28px", ...t.title }}
        />
        <div data-split-lines="" style={{ ...ENTRIES, ...t.entries }}>
          {!outline.length && <div style={{ color: "var(--muted)" }}>Add chapters or sub-headings to fill the contents.</div>}
          {outline.map((o, i) => {
            const top = CHAPTER_TYPES.includes(o.type) || (!chaptered && o.type === "h2");
            return (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  paddingLeft: (indent[o.type] || 0) + "em",
                  // One blank line above each chapter keeps every row on the line grid, so the contents can split cleanly.
                  marginTop: top && i > 0 ? "calc(var(--body-lh, 1.85) * 1em)" : 0,
                  fontWeight: top ? 700 : "inherit",
                }}
              >
                {o.number && <span style={{ flex: "0 0 auto", minWidth: top ? "1.5em" : "2.3em", paddingRight: "0.6em" }}>{o.number}</span>}
                <span style={{ minWidth: 0 }}>{o.text || "Untitled"}</span>
                {o.page != null && (
                  <>
                    {top ? <span style={{ flex: 1 }}></span> : <span style={LEADER}>{DOTS}</span>}
                    <span style={PAGE}>{o.page}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
