import "./FormatToolbar.css";

function handleLink() {
  const url = window.prompt("Link URL");
  if (url) document.execCommand("createLink", false, url);
}

function handleLead() {
  document.execCommand("foreColor", false, "#1E1E1E");
  document.execCommand("bold");
}

export function FormatToolbar({ bar, zoom }) {
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
    </div>
  );
}
