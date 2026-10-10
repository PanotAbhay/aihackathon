import { useState } from "react";
import { PALETTE_GROUPS, AI_FILL_TYPES } from "../../../data/index.js";
import "./ElementsPanel.css";

const HINT_SUFFIX = " — click to insert at the cursor, or drag it in";
const AI_HINT_SUFFIX = " — drop it beside a paragraph to build it from that text";

function hintFor(item) {
  return item.hint + (AI_FILL_TYPES.includes(item.type) ? AI_HINT_SUFFIX : HINT_SUFFIX);
}

function filterGroups(query) {
  const q = query.trim().toLowerCase();
  if (!q) return PALETTE_GROUPS;
  return PALETTE_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => (i.label + " " + hintFor(i)).toLowerCase().includes(q)) }))
    .filter((g) => g.items.length);
}

export function ElementsPanel({ open, onInsert, onDragStart, onDragEnd }) {
  const [query, setQuery] = useState("");

  return (
    <aside className={`elements-panel${open ? "" : " elements-panel--closed"}`}>
      <div className="elements-panel-inner">
        <div className="elements-panel-head">
          <div className="elements-panel-title">Elements</div>
          <div className="elements-panel-search">
            <span className="ms elements-panel-search-icon">search</span>
            <input
              className="elements-panel-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
              placeholder="Search blocks"
            />
          </div>
        </div>
        <div className="elements-panel-list">
          {filterGroups(query).map((g) => (
            <div key={g.key} className="elements-group">
              <div className="elements-group-label">{g.label}</div>
              <div className="elements-group-items">
                {g.items.map((item) => (
                  <div
                    key={item.type}
                    className="elements-item"
                    draggable="true"
                    title={hintFor(item)}
                    onDragStart={(e) => onDragStart(e, item.type)}
                    onDragEnd={onDragEnd}
                    onClick={() => onInsert(item)}
                  >
                    <span className="ms elements-item-icon">{item.icon}</span>
                    <span className="elements-item-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
