import { bindContent } from "../../../../utils/dom.js";

// The DOM owns the text while editing; React only writes it back when the field isn't focused.
export function EditableText({ as: Tag = "div", value, html = false, onCommit, ...props }) {
  return (
    <Tag
      {...props}
      contentEditable
      ref={(node) => bindContent(node, value, html)}
      onBlur={(e) => onCommit(html ? e.target.innerHTML : e.target.innerText)}
    />
  );
}
