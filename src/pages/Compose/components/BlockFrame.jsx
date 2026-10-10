import { TEXTISH_TYPES, HEADING_TYPES, IMAGE_TYPES, TEXT_TYPE_OPTIONS } from "../../../data/index.js";
import { TextBlock } from "./blocks/TextBlock.jsx";
import { BylineBlock } from "./blocks/BylineBlock.jsx";
import { QuoteBlock } from "./blocks/QuoteBlock.jsx";
import { ImagesBlock } from "./blocks/ImagesBlock.jsx";
import { StatsBlock } from "./blocks/StatsBlock.jsx";
import { BarChartBlock } from "./blocks/BarChartBlock.jsx";
import { LineChartBlock } from "./blocks/LineChartBlock.jsx";
import { PollBlock } from "./blocks/PollBlock.jsx";
import { TableBlock } from "./blocks/TableBlock.jsx";
import { TimelineBlock } from "./blocks/TimelineBlock.jsx";
import { NutshellBlock } from "./blocks/NutshellBlock.jsx";
import { DividerBlock } from "./blocks/DividerBlock.jsx";
import { DropLine } from "./DropLine.jsx";
import "./BlockFrame.css";

const BLOCK_BODIES = {
  byline: BylineBlock,
  quote: QuoteBlock,
  stats: StatsBlock,
  chart: BarChartBlock,
  line: LineChartBlock,
  poll: PollBlock,
  table: TableBlock,
  timeline: TimelineBlock,
  nutshell: NutshellBlock,
  divider: DividerBlock,
};

function bodyFor(type) {
  if (TEXTISH_TYPES.includes(type)) return TextBlock;
  if (IMAGE_TYPES.includes(type)) return ImagesBlock;
  return BLOCK_BODIES[type];
}

// Text blocks switching to or from a list need their markup converted.
function changeType(x, type) {
  const isList = (t) => t === "bullets" || t === "numbered";
  if (isList(type) && !isList(x.type)) {
    x.html = "<li>" + String(x.html || "").replace(/<[^>]*>/g, "") + "</li>";
  } else if (!isList(type) && isList(x.type)) {
    x.html = String(x.html || "").replace(/<\/li>\s*<li>/g, " · ").replace(/<[^>]*>/g, "");
  }
  x.type = type;
}

function wrapStyle(selected, inLive) {
  return {
    position: "relative",
    padding: "1px 0",
    ...(selected && { outline: "1px solid rgba(176,141,74,0.55)", outlineOffset: 14 }),
    ...(inLive && { boxShadow: "inset 3px 0 0 rgba(201,162,39,0.45)", paddingLeft: 16, marginLeft: -16 }),
  };
}

function SelectionHandles() {
  return (
    <div data-chrome="" className="block-handles">
      <div className="block-handle block-handle--tl"></div>
      <div className="block-handle block-handle--tr"></div>
      <div className="block-handle block-handle--bl"></div>
      <div className="block-handle block-handle--br"></div>
    </div>
  );
}

function BlockToolbar({ block, isHeading, sectionSize, onPatch, onDeleteSection, onSuggest, onDuplicate }) {
  return (
    <div data-chrome="" className="block-toolbar">
      {TEXTISH_TYPES.includes(block.type) && (
        <select className="block-type-select" value={block.type} onChange={(e) => { const v = e.target.value; onPatch((x) => changeType(x, v)); }}>
          {TEXT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {isHeading && (
        <>
          <span className="block-section-label">{sectionSize > 1 ? "SECTION · " + sectionSize + " BLOCKS" : "SECTION"}</span>
          <button className="block-toolbar-btn" onClick={onDeleteSection}><span className="ms block-toolbar-icon">delete_sweep</span>Delete section</button>
        </>
      )}
      {(block.type === "body" || block.type === "dropcap") && (
        <button className="block-toolbar-btn block-toolbar-btn--gold" onClick={onSuggest}><span className="ms block-toolbar-icon">auto_awesome</span>Suggest</button>
      )}
      <button className="block-toolbar-btn" onClick={onDuplicate}><span className="ms block-toolbar-icon">content_copy</span>Duplicate</button>
    </div>
  );
}

export function BlockFrame({
  block,
  index,
  sectionSize,
  selected,
  inLive,
  dropActive,
  readTime,
  onSelect,
  onPatch,
  onDelete,
  onDeleteSection,
  onDuplicate,
  onSuggest,
  onShowDrop,
  onDropAt,
  onMoveStart,
  onDragEnd,
}) {
  const isHeading = HEADING_TYPES.includes(block.type);
  const showChrome = block.type !== "h1" && block.type !== "standfirst";
  const Body = bodyFor(block.type);

  function dropIndex(e) {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientY < r.top + r.height / 2 ? index : index + 1;
  }

  function handleDragOver(e) {
    e.preventDefault();
    onShowDrop(dropIndex(e));
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    onDropAt(dropIndex(e));
  }

  function stop(fn) {
    return (e) => { e.stopPropagation(); fn(); };
  }

  return (
    <div
      className="nt-blk"
      data-sel={selected ? "1" : "0"}
      style={wrapStyle(selected, inLive)}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id, index); }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <DropLine visible={dropActive} />

      {selected && <SelectionHandles />}

      {showChrome && (
        <div data-chrome="" className="block-chrome">
          <div
            className="block-chrome-btn block-chrome-btn--drag"
            draggable="true"
            title={isHeading && sectionSize > 1 ? "Drag to move this whole section (" + sectionSize + " blocks)" : "Drag to reorder"}
            onDragStart={(e) => onMoveStart(e, block.id, isHeading && sectionSize > 1)}
            onDragEnd={onDragEnd}
          >
            <span className="ms block-chrome-icon">{isHeading ? "swap_vert" : "drag_indicator"}</span>
          </div>
          <div className="block-chrome-btn" title="Delete" onClick={stop(() => onDelete(block.id))}>
            <span className="ms block-chrome-icon--sm">delete</span>
          </div>
        </div>
      )}

      {selected && (
        <BlockToolbar
          block={block}
          isHeading={isHeading}
          sectionSize={sectionSize}
          onPatch={onPatch}
          onDeleteSection={stop(() => onDeleteSection(block.id))}
          onSuggest={stop(() => onSuggest(block))}
          onDuplicate={stop(() => onDuplicate(block.id))}
        />
      )}

      {Body && <Body block={block} onPatch={onPatch} readTime={readTime} onDragEnd={onDragEnd} />}
    </div>
  );
}
