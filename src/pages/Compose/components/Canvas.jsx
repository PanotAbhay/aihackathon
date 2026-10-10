import { useState, useRef, useLayoutEffect } from "react";
import { PROSE_TYPES, HEADING_TYPES, IMAGE_TYPES } from "../../../data/index.js";
import { sectionEnd } from "../../../utils/blocks.js";
import { A4, planPages } from "../../../utils/pagination.js";
import { BlockFrame } from "./BlockFrame.jsx";
import { ProseBlock } from "./blocks/ProseBlock.jsx";
import { DropLine } from "./DropLine.jsx";
import "./Canvas.css";

const MASTHEAD_TYPES = ["h1", "standfirst", "byline"];
// Blocks that may float past following paragraphs when they don't fit (see planPages).
const FLOAT_TYPES = ["image", "pair", "gallery", "chart", "line", "poll", "table", "stats", "timeline", "nutshell"];

// Inline because Copy HTML and Preview export the pages as they are.
const PAGE_STYLE = {
  position: "relative",
  width: A4.width,
  minHeight: A4.height,
  boxSizing: "border-box",
  padding: A4.margin,
  margin: "0 auto 28px",
  background: "var(--paper)",
  boxShadow: "0 10px 34px rgba(0,0,0,0.38)",
  breakAfter: "page",
};
const FOLIO_STYLE = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 30,
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.1em",
  color: "var(--muted)",
};

// LaTeX-style numbers for sections ("2", "2.1"), figures and tables, keyed by block id.
function numberBlocks(blocks) {
  const numbers = {};
  let section = 0;
  let subsection = 0;
  let figure = 0;
  let table = 0;
  blocks.forEach((b) => {
    if (b.type === "h2") { section += 1; subsection = 0; numbers[b.id] = String(section); }
    else if (b.type === "h3") { subsection += 1; numbers[b.id] = section ? section + "." + subsection : String(subsection); }
    else if (IMAGE_TYPES.includes(b.type) || b.type === "chart" || b.type === "line") { figure += 1; numbers[b.id] = String(figure); }
    else if (b.type === "table") { table += 1; numbers[b.id] = String(table); }
  });
  return numbers;
}

// On paper, photos stay inside the text block, and narrow columns get compact stats and tables.
function printTheme(theme, columns) {
  const t = { ...theme, figure: { ...theme.figure, margin: "24px 0" } };
  if (columns !== 2) return t;
  return {
    ...t,
    stats: { ...theme.stats, perRow: 2 },
    table: { ...theme.table, cell: { ...(theme.table && theme.table.cell), fontSize: 13 } },
  };
}

// Selecting a heading highlights every block in its section.
function liveRange(blocks, sel) {
  const si = sel ? blocks.findIndex((b) => b.id === sel) : -1;
  if (si < 0 || !HEADING_TYPES.includes(blocks[si].type)) return [-1, -1];
  return [si, sectionEnd(blocks, si)];
}

function mastheadCount(blocks) {
  let n = 0;
  while (n < blocks.length && MASTHEAD_TYPES.includes(blocks[n].type)) n += 1;
  return n;
}

// Heights of every block and paragraph (and paragraphs' line heights), in unzoomed CSS px.
// Paragraphs use a fixed gap so a height never depends on where it lands, which would make
// the layout oscillate.
function measureUnits(root, paraGap) {
  const heights = {};
  const lines = {};
  root.querySelectorAll("[data-unit]").forEach((el) => { heights[el.getAttribute("data-unit")] = el.offsetHeight; });
  root.querySelectorAll("[data-prose]").forEach((wrap) => {
    const ids = JSON.parse(wrap.getAttribute("data-ids") || "[]");
    const ps = Array.from(wrap.children);
    ids.forEach((id, k) => {
      // Paragraphs typed but not yet saved add to the last saved one.
      const extra = k === ids.length - 1 ? ps.slice(ids.length).reduce((n, p) => n + p.offsetHeight + paraGap, 0) : 0;
      heights[id] = (ps[k] ? ps[k].offsetHeight + paraGap : 40) + extra;
      if (ps[k]) {
        const cs = getComputedStyle(ps[k]);
        lines[id] = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      }
    });
  });
  return { heights, lines };
}

function sameHeights(a, b) {
  const keys = Object.keys(b);
  return keys.length === Object.keys(a).length && keys.every((k) => Math.abs((a[k] || 0) - b[k]) < 2);
}

// The insertion point nearest the pointer, among boundaries in the column under it. Works the
// same for one continuous page or many A4 pages with two columns. Returns the line to draw in
// unzoomed px relative to `root`, and the prose context the AI uses to fill dropped elements.
function dropBoundary(root, x, y, zoom) {
  const rr = root.getBoundingClientRect();
  const bounds = [];
  root.querySelectorAll("[data-drop-index]").forEach((el) => {
    const index = Number(el.getAttribute("data-drop-index"));
    const r = el.getBoundingClientRect();
    bounds.push({ index, y: r.top, r });
    if (!el.hasAttribute("data-drop-tail")) bounds.push({ index: index + 1, y: r.bottom, r });
  });
  root.querySelectorAll("[data-drop-start]").forEach((el) => {
    const start = Number(el.getAttribute("data-drop-start"));
    const prose = el.querySelector("[data-prose]");
    const ids = JSON.parse(prose.getAttribute("data-ids") || "[]");
    const ps = Array.from(prose.children).slice(0, ids.length);
    // A slice of a split paragraph hides edges outside its window; those are dropped on the other slice.
    const wr = el.getBoundingClientRect();
    const visible = (yy) => yy >= wr.top - 2 && yy <= wr.bottom + 2;
    ps.forEach((p, k) => {
      const r = p.getBoundingClientRect();
      if (visible(r.top)) bounds.push({ index: start + k, y: r.top, r, prose: { groupIds: ids, adjacentId: ids[Math.max(0, k - 1)] } });
    });
    const last = ps[ps.length - 1];
    if (last) {
      const r = last.getBoundingClientRect();
      if (visible(r.bottom)) bounds.push({ index: start + ids.length, y: r.bottom, r, prose: { groupIds: ids, adjacentId: ids[ids.length - 1] } });
    }
  });
  if (!bounds.length) return null;

  const inColumn = bounds.filter((b) => x >= b.r.left - 30 && x <= b.r.right + 30);
  const pool = inColumn.length ? inColumn : bounds;
  const best = pool.reduce((a, b) => (Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a));
  return {
    index: best.index,
    prose: best.prose || null,
    line: {
      top: Math.round((best.y - rr.top) / zoom) - 1,
      left: Math.round((best.r.left - rr.left) / zoom),
      width: Math.round(best.r.width / zoom),
    },
  };
}

export function Canvas({
  blocks,
  sel,
  building,
  look,
  theme: baseTheme,
  layout,
  zoom,
  allowed,
  drop,
  readTime,
  onClearSel,
  onSelect,
  onCaret,
  onPatch,
  onDelete,
  onDeleteSection,
  onDuplicate,
  onCommitProse,
  onShowDrop,
  onDropAt,
  onMoveStart,
  onDragEnd,
}) {
  const print = layout === "print-1" || layout === "print-2";
  const columns = layout === "print-2" ? 2 : 1;
  const theme = print ? printTheme(baseTheme, columns) : baseTheme;
  const innerRef = useRef(null);
  const [measured, setMeasured] = useState({ heights: {}, lines: {} });
  // Re-layout passes since the content last changed; a hard stop guards against any oscillation.
  const passesRef = useRef({ blocks: null, count: 0 });
  const { heights, lines } = measured;
  const [liveFrom, liveTo] = liveRange(blocks, sel);
  const numbers = theme.numbering || theme.captions ? numberBlocks(blocks) : {};
  const indexOf = Object.fromEntries(blocks.map((b, i) => [b.id, i]));
  const paraGap = theme.paragraphIndent ? 0 : 18;

  const masthead = mastheadCount(blocks);
  const pages = print
    ? planPages(
      blocks.map((b) => {
        const height = heights[b.id] ?? 40;
        const unit = { id: b.id, height, keepWithNext: HEADING_TYPES.includes(b.type), float: FLOAT_TYPES.includes(b.type) };
        // Paragraphs can split across columns and pages at a line break.
        if (PROSE_TYPES.includes(b.type) && lines[b.id]) Object.assign(unit, { lineHeight: lines[b.id], textHeight: height - paraGap, lede: b.type === "dropcap" });
        return unit;
      }),
      { columns, mastheadCount: masthead },
    )
    : null;

  // Re-measure after every render; a changed height re-flows the pages once.
  useLayoutEffect(() => {
    if (!print || !innerRef.current) return;
    const passes = passesRef.current;
    if (passes.blocks !== blocks) { passes.blocks = blocks; passes.count = 0; }
    const next = measureUnits(innerRef.current, paraGap);
    if (sameHeights(heights, next.heights) || passes.count >= 6) return;
    passes.count += 1;
    setMeasured(next);
  });

  function handleDragOver(e) {
    e.preventDefault();
    const b = dropBoundary(innerRef.current, e.clientX, e.clientY, zoom);
    if (b) onShowDrop(b.index, b.line, b.prose);
  }

  function handleDrop(e) {
    e.preventDefault();
    const b = dropBoundary(innerRef.current, e.clientX, e.clientY, zoom);
    if (b) onDropAt(b.index, b.prose);
    else onDragEnd();
  }

  // Blocks render one by one; consecutive paragraphs share one text field. Items are block
  // ids, or { id, show, skip } for a paragraph split across a column or page break.
  function renderUnits(items, { span = false, side = "left" } = {}) {
    const list = items.map((it) => (typeof it === "string" ? { id: it } : it));
    const out = [];
    let i = 0;
    while (i < list.length) {
      const index = indexOf[list[i].id];
      const block = blocks[index];
      if (PROSE_TYPES.includes(block.type)) {
        const group = [list[i]];
        while (
          i + group.length < list.length
          && !group[group.length - 1].show
          && !list[i + group.length].skip
          && indexOf[list[i + group.length].id] === index + group.length
          && PROSE_TYPES.includes(blocks[index + group.length].type)
        ) {
          group.push(list[i + group.length]);
        }
        const members = group.map((g) => blocks[indexOf[g.id]]);
        const last = group[group.length - 1];
        // The visible part of a group whose last paragraph continues in the next column.
        const clip = last.show ? group.slice(0, -1).reduce((n, g) => n + (heights[g.id] || 0), 0) + last.show + (group[0].skip ? -group[0].skip : 0) : null;
        out.push(
          <ProseBlock
            key={"prose" + block.id + (group[0].skip ? "-" + group[0].skip : "")}
            members={members}
            theme={theme}
            start={index}
            continued={index > 0 && PROSE_TYPES.includes(blocks[index - 1].type)}
            skip={group[0].skip || 0}
            clip={clip}
            onCaret={onCaret}
            onCommit={onCommitProse}
          />,
        );
        i += group.length;
        continue;
      }
      out.push(
        <BlockFrame
          key={block.id}
          block={block}
          index={index}
          sectionSize={sectionEnd(blocks, index) - index}
          selected={sel === block.id}
          inLive={index >= liveFrom && index < liveTo}
          building={building.includes(block.id)}
          allowed={allowed}
          theme={theme}
          number={numbers[block.id]}
          span={span}
          chromeSide={side}
          readTime={readTime}
          onSelect={onSelect}
          onPatch={(fn) => onPatch(block.id, fn)}
          onDelete={onDelete}
          onDeleteSection={onDeleteSection}
          onDuplicate={onDuplicate}
          onMoveStart={onMoveStart}
          onDragEnd={onDragEnd}
        />,
      );
      i += 1;
    }
    return out;
  }

  const tail = (
    <div
      data-chrome=""
      data-drop-index={blocks.length}
      data-drop-tail=""
      className={`canvas-tail${drop.index === blocks.length ? " canvas-tail--active" : ""}${print ? " canvas-tail--print" : ""}`}
    >
      <span className="canvas-tail-label">Drag elements here</span>
    </div>
  );

  const gap = (theme.columns && theme.columns.columnGap) || 40;
  const rule = theme.columns && theme.columns.columnRule;

  return (
    <div className={`canvas${print ? " canvas--print" : ""}`} style={look} onMouseDown={onClearSel}>
      <div ref={innerRef} className="canvas-inner" onDragOver={handleDragOver} onDrop={handleDrop}>
        {!print && (
          <div data-article="" data-layout="web" style={{ maxWidth: 796, margin: "0 auto", padding: "44px 36px 160px 72px", ...theme.article }}>
            {renderUnits(blocks.map((b) => b.id))}
            {tail}
          </div>
        )}

        {print && (
          <>
            <div data-article="" data-layout={layout} className="print-desk">
              {pages.map((page, pi) => (
                <section key={pi} data-page="" style={PAGE_STYLE}>
                  {page.masthead.length > 0 && <div data-page-masthead="">{renderUnits(page.masthead, { span: columns === 2 })}</div>}
                  {/* Both columns must be exactly the same width: a paragraph split across them has to wrap identically. */}
                  <div
                    data-page-body=""
                    style={{ position: "relative", display: "grid", gridTemplateColumns: columns === 2 ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)", columnGap: gap, alignItems: "start" }}
                  >
                    {columns === 2 && rule && <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", borderLeft: rule }}></div>}
                    {page.columns.map((ids, ci) => (
                      <div key={ci} data-page-column="">
                        {renderUnits(ids, { side: ci > 0 ? "right" : "left" })}
                      </div>
                    ))}
                  </div>
                  <div data-folio="" style={FOLIO_STYLE}>{pi + 1}</div>
                </section>
              ))}
            </div>
            {tail}
          </>
        )}

        <div data-chrome="">
          <DropLine visible={drop.index >= 0 && !!drop.line} top={drop.line ? drop.line.top : 0} left={drop.line ? drop.line.left : 0} width={drop.line ? drop.line.width : 0} raised />
        </div>
      </div>
    </div>
  );
}
