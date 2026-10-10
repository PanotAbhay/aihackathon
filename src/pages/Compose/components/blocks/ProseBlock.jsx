import { useRef } from "react";
import { bindContent, caretParagraphIndex, WEBKIT_DROP_CAP_BUG } from "../../../../utils/dom.js";
import { BODY_TEXT } from "./articleStyles.js";

// `skip` and `clip` show one slice of a paragraph run split across a page or column break:
// the run is drawn whole, shifted up by `skip` and cut off after `clip` px.
export function ProseBlock({ members, theme, start, continued, skip = 0, clip = null, onCaret, onCommit }) {
  const sliced = skip > 0 || clip != null;
  const ids = members.map((m) => m.id);
  const html = members.map((m) => "<p>" + (m.html || "") + "</p>").join("");
  const lede = members.some((m) => m.type === "dropcap");
  const clickRef = useRef(null);

  function handleCaret(e) {
    onCaret(start + caretParagraphIndex(e.currentTarget) + 1);
  }

  // In Safari the drop cap becomes a normal letter while the field is being edited (index.css),
  // which moves the text under the pointer. Remember where the first click landed on the old
  // layout and put the caret there.
  function handleMouseDown(e) {
    const focusing = WEBKIT_DROP_CAP_BUG && lede && document.activeElement !== e.currentTarget;
    clickRef.current = focusing && document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
  }

  function handleMouseUp(e) {
    const range = clickRef.current;
    clickRef.current = null;
    const selection = window.getSelection();
    if (!range || !selection.isCollapsed || !e.currentTarget.contains(range.startContainer)) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <div
      className="nt-blk"
      style={{ position: "relative", padding: "1px 0", ...(sliced && { overflow: "hidden" }), ...(clip != null && { height: clip + 3 }) }}
      data-drop-start={start}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        data-prose=""
        data-lede={lede ? "1" : "0"}
        data-ids={JSON.stringify(ids)}
        data-indent={theme.paragraphIndent ? "" : undefined}
        data-continued={continued ? "" : undefined}
        contentEditable
        ref={(node) => bindContent(node, html, true)}
        onFocus={(e) => e.currentTarget.setAttribute("data-editing", "")}
        onBlur={(e) => { e.currentTarget.removeAttribute("data-editing"); onCommit(ids, e.currentTarget); }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleCaret}
        onKeyUp={handleCaret}
        style={{ ...BODY_TEXT, ...theme.body, ...(skip > 0 && { marginTop: -skip }) }}
      ></div>
    </div>
  );
}
