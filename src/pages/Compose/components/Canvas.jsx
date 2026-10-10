import { PROSE_TYPES, HEADING_TYPES, IMAGE_TYPES } from "../../../data/index.js";
import { sectionEnd } from "../../../utils/blocks.js";
import { BlockFrame } from "./BlockFrame.jsx";
import { ProseBlock } from "./blocks/ProseBlock.jsx";
import "./Canvas.css";

// Consecutive paragraphs render as ONE continuous text field, not boxes.
function groupBlocks(blocks) {
  const items = [];
  let i = 0;
  while (i < blocks.length) {
    if (!PROSE_TYPES.includes(blocks[i].type)) {
      items.push({ kind: "block", block: blocks[i], index: i });
      i += 1;
      continue;
    }
    const start = i;
    while (i < blocks.length && PROSE_TYPES.includes(blocks[i].type)) i += 1;
    items.push({ kind: "prose", members: blocks.slice(start, i), start, end: i });
  }
  return items;
}

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

// Selecting a heading highlights every block in its section.
function liveRange(blocks, sel) {
  const si = sel ? blocks.findIndex((b) => b.id === sel) : -1;
  if (si < 0 || !HEADING_TYPES.includes(blocks[si].type)) return [-1, -1];
  return [si, sectionEnd(blocks, si)];
}

export function Canvas({
  blocks,
  sel,
  building,
  look,
  theme,
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
  const [liveFrom, liveTo] = liveRange(blocks, sel);
  const numbers = theme.numbering || theme.captions ? numberBlocks(blocks) : {};
  const tailActive = drop.index === blocks.length;

  return (
    <div className="canvas" style={look} onMouseDown={onClearSel}>
      <div data-article="" style={{ maxWidth: 796, margin: "0 auto", padding: "44px 36px 160px 72px", ...theme.article }}>
        {groupBlocks(blocks).map((item) => {
          if (item.kind === "prose") {
            const id = "prose" + item.members[0].id;
            return (
              <ProseBlock
                key={id}
                members={item.members}
                theme={theme}
                start={item.start}
                end={item.end}
                dropY={drop.group === id ? drop.y : null}
                onCaret={onCaret}
                onCommit={onCommitProse}
                onShowDrop={(index, y) => onShowDrop(index, id, y)}
                onDropAt={onDropAt}
              />
            );
          }
          const { block, index } = item;
          return (
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
              dropActive={drop.index === index}
              readTime={readTime}
              onSelect={onSelect}
              onPatch={(fn) => onPatch(block.id, fn)}
              onDelete={onDelete}
              onDeleteSection={onDeleteSection}
              onDuplicate={onDuplicate}
              onShowDrop={onShowDrop}
              onDropAt={onDropAt}
              onMoveStart={onMoveStart}
              onDragEnd={onDragEnd}
            />
          );
        })}

        <div
          data-chrome=""
          className={`canvas-tail${tailActive ? " canvas-tail--active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); onShowDrop(blocks.length); }}
          onDrop={(e) => { e.preventDefault(); onDropAt(blocks.length); }}
        >
          <span className="canvas-tail-label">Drag elements here</span>
        </div>
      </div>
    </div>
  );
}
