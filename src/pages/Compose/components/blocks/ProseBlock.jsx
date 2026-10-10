import { bindContent, caretParagraphIndex } from "../../../../utils/dom.js";
import { BODY_TEXT } from "./articleStyles.js";

// `skip` and `clip` show one slice of a paragraph run split across a page or column break:
// the run is drawn whole, shifted up by `skip` and cut off after `clip` px.
export function ProseBlock({ members, theme, start, continued, skip = 0, clip = null, onCaret, onCommit }) {
  const sliced = skip > 0 || clip != null;
  const ids = members.map((m) => m.id);
  const html = members.map((m) => "<p>" + (m.html || "") + "</p>").join("");
  const lede = members.some((m) => m.type === "dropcap");

  function handleCaret(e) {
    onCaret(start + caretParagraphIndex(e.currentTarget) + 1);
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
        onBlur={(e) => onCommit(ids, e.currentTarget)}
        onClick={handleCaret}
        onKeyUp={handleCaret}
        style={{ ...BODY_TEXT, ...theme.body, ...(skip > 0 && { marginTop: -skip }) }}
      ></div>
    </div>
  );
}
