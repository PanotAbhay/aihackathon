import { TEMPLATES } from "../../../data/index.js";
import "./DocTabs.css";

export function DocTabs({ docs, activeId, onSelect, onClose, onNew }) {
  return (
    <div className="doc-tabs">
      {docs.map((d) => (
        <div
          key={d.id}
          className={`doc-tab${d.id === activeId ? " doc-tab--active" : ""}`}
          title={d.title + " · " + TEMPLATES[d.templateKey].label + " template"}
          onClick={() => onSelect(d.id)}
        >
          <span className="ms doc-tab-icon">{TEMPLATES[d.templateKey].icon}</span>
          <span className="doc-tab-title">{d.title}</span>
          <button className="doc-tab-close" title="Close this document" onClick={(e) => { e.stopPropagation(); onClose(d); }}>
            <span className="ms doc-tab-close-icon">close</span>
          </button>
        </div>
      ))}
      <button className="doc-tabs-new" title="New document from a template" onClick={onNew}>
        <span className="ms doc-tabs-new-icon">add</span>
      </button>
    </div>
  );
}
