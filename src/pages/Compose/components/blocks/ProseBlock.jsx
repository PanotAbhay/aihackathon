import { bindContent, caretParagraphIndex } from "../../../../utils/dom.js";
import { DropLine } from "../DropLine.jsx";
import { BODY_TEXT } from "./articleStyles.js";

// Index of the paragraph boundary nearest the pointer, and the y offset to draw the line at.
function dropTarget(e, start, end) {
  const wrap = e.currentTarget;
  const wr = wrap.getBoundingClientRect();
  const kids = Array.from(wrap.querySelectorAll("p"));
  for (let k = 0; k < kids.length; k++) {
    const r = kids[k].getBoundingClientRect();
    if (e.clientY < r.top + r.height / 2) return { index: start + k, y: Math.round(r.top - wr.top - 9) };
  }
  return { index: end, y: Math.round(wr.height) };
}

export function ProseBlock({ members, start, end, dropY, onCaret, onCommit, onShowDrop, onDropAt }) {
  const ids = members.map((m) => m.id);
  const html = members.map((m) => "<p>" + (m.html || "") + "</p>").join("");
  const lede = members.some((m) => m.type === "dropcap");

  function handleCaret(e) {
    onCaret(start + caretParagraphIndex(e.currentTarget) + 1);
  }

  function handleDragOver(e) {
    e.preventDefault();
    const { index, y } = dropTarget(e, start, end);
    onShowDrop(index, y);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    onDropAt(dropTarget(e, start, end).index);
  }

  return (
    <div
      className="nt-blk"
      style={{ position: "relative", padding: "1px 0" }}
      onClick={(e) => e.stopPropagation()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <DropLine visible={dropY !== null} top={dropY ?? -6} raised />
      <div
        data-prose=""
        data-lede={lede ? "1" : "0"}
        data-ids={JSON.stringify(ids)}
        contentEditable
        ref={(node) => bindContent(node, html, true)}
        onBlur={(e) => onCommit(ids, e.currentTarget)}
        onClick={handleCaret}
        onKeyUp={handleCaret}
        style={BODY_TEXT}
      ></div>
    </div>
  );
}
