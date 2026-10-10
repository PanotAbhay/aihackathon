import "./FormatToolbar.css";

function handleLink() {
  const url = window.prompt("Link URL");
  if (url) document.execCommand("createLink", false, url);
}

function handleLead() {
  document.execCommand("foreColor", false, "#1E1E1E");
  document.execCommand("bold");
}

export function FormatToolbar({ bar, zoom, onRewrite, onSuggest }) {
  return (
    <div
      className="format-bar"
      style={{ left: Math.round(bar.x / zoom) + "px", top: Math.round(bar.y / zoom) + "px" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button className="format-bar-btn" title="Bold" onClick={() => document.execCommand("bold")}><span className="ms format-bar-icon">format_bold</span></button>
      <button className="format-bar-btn" title="Italic" onClick={() => document.execCommand("italic")}><span className="ms format-bar-icon">format_italic</span></button>
      <button className="format-bar-btn" title="Add a link" onClick={handleLink}><span className="ms format-bar-icon">link</span></button>
      <button className="format-bar-btn" title="Highlight as lead sentence" onClick={handleLead}><span className="ms format-bar-icon">format_ink_highlighter</span></button>
      <div className="format-bar-divider"></div>
      <button className="format-bar-btn format-bar-btn--text" title="Rewrite this text with AI" onClick={onRewrite}><span className="ms format-bar-icon--sm">edit_note</span>Rewrite</button>
      <button className="format-bar-btn format-bar-btn--text format-bar-btn--gold" title="Ask AI to add an element here" onClick={onSuggest}><span className="ms format-bar-icon--sm">auto_awesome</span>Add</button>
    </div>
  );
}
