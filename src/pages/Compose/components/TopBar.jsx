import { useEffect, useRef, useState } from "react";
import { TEMPLATES } from "../../../data/index.js";
import "./TopBar.css";

const EXPORT_ITEMS = [
  { id: "html", icon: "download", label: "Download HTML" },
  { id: "copy", icon: "content_copy", label: "Copy HTML" },
];

function ExportMenu({ exported, exporting, onDownloadHtml, onCopy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const actions = { html: onDownloadHtml, copy: onCopy };
  const label = exporting ? "Preparing…" : exported ? "Copied" : "Export";

  return (
    <div className="top-bar-export" ref={ref}>
      <button
        className="top-bar-btn"
        disabled={exporting}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="ms top-bar-icon">ios_share</span>{label}
        <span className="ms top-bar-caret">expand_more</span>
      </button>
      {open && (
        <div className="top-bar-menu" role="menu">
          {EXPORT_ITEMS.map((item) => (
            <button
              key={item.id}
              className="top-bar-menu-item"
              role="menuitem"
              onClick={() => { setOpen(false); actions[item.id](); }}
            >
              <span className="ms top-bar-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopBar({
  docTitle, onDocTitle, templateKey, onTemplate, note, noteErr, busy, zoom, onZoomIn, onZoomOut,
  exported, exporting, onExport, onDownloadHtml, onExportTex, onImport,
}) {
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
        {onExportTex && (
          <button className="top-bar-btn" title="Download a LaTeX file — a .zip with your photos when the article has any, ready for Overleaf" onClick={onExportTex}>
            <span className="ms top-bar-icon">download</span>Export .tex
          </button>
        )}
        <ExportMenu
          exported={exported}
          exporting={exporting}
          onDownloadHtml={onDownloadHtml}
          onCopy={onExport}
        />
        <button className="top-bar-btn top-bar-btn--gold" onClick={onImport}>
          <span className="ms top-bar-icon">auto_awesome</span>Import
        </button>
      </div>
    </div>
  );
}
