import { TEMPLATES } from "../../../data/index.js";
import "./TopBar.css";

export function TopBar({ docTitle, onDocTitle, templateKey, onTemplate, note, noteErr, busy, zoom, onZoomIn, onZoomOut, exported, onExport, onImport }) {
  return (
    <div className="top-bar">
      <div className="top-bar-brand">
        <span className="top-bar-logo">COMPOSE</span>
      </div>
      <div className="top-bar-doc">
        <span
          className="top-bar-title"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => onDocTitle(e.target.innerText)}
        >
          {docTitle}
        </span>
        <span className="ms top-bar-title-caret">expand_more</span>
        <span className="top-bar-status">Draft</span>
        <label className="top-bar-template" title="Template: sets the look, the elements you can add and the AI rules. Your text is kept.">
          <span className="ms top-bar-template-icon">{TEMPLATES[templateKey].icon}</span>
          <select className="top-bar-template-select" value={templateKey} onChange={(e) => onTemplate(e.target.value)}>
            {Object.values(TEMPLATES).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
      </div>
      <div className="top-bar-actions">
        {note && <span className="top-bar-note" style={{ color: noteErr ? "#E8836F" : "rgba(242,239,233,0.55)" }}>{note}</span>}
        <div className="top-bar-saved">
          <span className="ms top-bar-saved-icon">check</span>
          <span className="top-bar-saved-label">{busy ? "Working…" : "All changes saved"}</span>
        </div>
        <div className="top-bar-zoom">
          <div className="top-bar-zoom-btn" title="Zoom out" onClick={onZoomOut}><span className="ms top-bar-icon">remove</span></div>
          <span className="top-bar-zoom-pct">{Math.round(zoom * 100) + "%"}</span>
          <div className="top-bar-zoom-btn" title="Zoom in" onClick={onZoomIn}><span className="ms top-bar-icon">add</span></div>
        </div>
        <div className="top-bar-divider"></div>
        <button className="top-bar-btn" onClick={onExport}>
          <span className="ms top-bar-icon">visibility</span>{exported ? "Copied" : "Copy HTML"}
        </button>
        <button className="top-bar-btn top-bar-btn--gold" onClick={onImport}>
          <span className="ms top-bar-icon">auto_awesome</span>Import
        </button>
      </div>
    </div>
  );
}
