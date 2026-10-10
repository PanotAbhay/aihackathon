import { EditableText } from "./EditableText.jsx";
import { FigureHeader } from "./FigureHeader.jsx";
import { RowControls } from "./RowControls.jsx";
import { FIGURE, MONO_OVERLINE } from "./articleStyles.js";
import "./StatsBlock.css";

const MAX_STATS = 5;
const NEW_STAT = { value: "00", label: "LABEL" };

export function StatsBlock({ block, onPatch }) {
  const cells = block.cells || [];

  function addAt(index) {
    onPatch((x) => { if (x.cells.length < MAX_STATS) x.cells.splice(index, 0, { ...NEW_STAT }); });
  }

  function removeAt(index) {
    onPatch((x) => { if (x.cells.length > 1) x.cells.splice(index, 1); });
  }

  return (
    <figure style={FIGURE}>
      <FigureHeader block={block} onPatch={onPatch} titlePlaceholder="Title" notePlaceholder="Source" marginBottom={20} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.max(1, cells.length) + ",1fr)" }}>
        {cells.map((c, i) => (
          <div key={block.id + "c" + i} style={i === 0 ? { padding: "4px 14px 4px 0" } : { padding: "4px 14px", borderLeft: "1px solid var(--rule)" }}>
            <div data-chrome="" className="stat-cell-controls">
              <button className="stat-cell-btn" title="Remove this stat" onClick={(e) => { e.stopPropagation(); removeAt(i); }}>×</button>
              <button className="stat-cell-btn" title="Add a stat after this one" onClick={(e) => { e.stopPropagation(); addAt(i + 1); }}>+</button>
            </div>
            <EditableText
              data-ph="00%"
              value={c.value}
              onCommit={(v) => onPatch((x) => { x.cells[i].value = v; })}
              style={{ fontFamily: "var(--font-sans)", fontSize: 34, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em", color: i === cells.length - 1 ? "var(--red)" : "var(--ink)", fontVariantNumeric: "lining-nums" }}
            />
            <EditableText
              data-ph="LABEL"
              value={c.label}
              onCommit={(v) => onPatch((x) => { x.cells[i].label = v; })}
              style={{ ...MONO_OVERLINE, color: "var(--muted)", marginTop: 11, lineHeight: 1.5 }}
            />
          </div>
        ))}
      </div>
      <RowControls
        noun="STAT"
        onAdd={() => addAt(cells.length)}
        onRemove={() => onPatch((x) => { if (x.cells.length > 1) x.cells.pop(); })}
      />
    </figure>
  );
}
