import { EditableText } from "./EditableText.jsx";
import { RowControls } from "./RowControls.jsx";
import { Caption } from "./Caption.jsx";
import { BODY_FONT, FIGURE, MONO_OVERLINE } from "./articleStyles.js";

const HEAD_CELL = { textAlign: "left", padding: "0 8px 11px 0", ...MONO_OVERLINE, color: "var(--muted)" };
// Worksheet tables (lab manual) rule every cell so students can fill them in.
const GRID_CELL = { border: "1px solid var(--rule)", padding: "10px 12px" };

function rowStyle(ri, t) {
  if (ri === 0) return { borderBottom: "1px solid var(--rule)", ...(t.grid && { background: "var(--paper-faint)" }) };
  const zebra = t.zebra !== false && ri % 2 === 0;
  return { ...(t.bodyRules !== false && { borderBottom: "1px solid var(--rule-light)" }), ...(zebra && { background: "var(--paper-faint)" }) };
}

function cellStyle(ri, ci, t) {
  const base = ri === 0
    ? { ...HEAD_CELL, ...t.head }
    : {
      padding: "13px 8px 13px 0",
      fontFamily: BODY_FONT,
      fontSize: 14,
      color: ci === 0 ? "var(--ink)" : "var(--ink-body)",
      ...(ci === 0 && { fontWeight: 700 }),
      ...t.cell,
    };
  return t.grid ? { ...base, ...GRID_CELL, ...(ri === 0 && { paddingTop: 10 }) } : base;
}

export function TableBlock({ block, theme, number, onPatch }) {
  const rows = block.rows || [];
  const t = theme.table || {};

  return (
    <figure style={FIGURE}>
      {theme.captions && (
        <Caption kind="Table" number={number} value={block.a} onCommit={(v) => onPatch((x) => { x.a = v; })} style={{ marginBottom: 8 }} />
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", ...t.table }}>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={block.id + "t" + ri} style={rowStyle(ri, t)}>
              {cells.map((val, ci) => (
                <EditableText
                  as="td"
                  key={block.id + "t" + ri + "c" + ci}
                  data-ph="—"
                  value={val}
                  onCommit={(v) => onPatch((x) => { x.rows[ri][ci] = v; })}
                  style={cellStyle(ri, ci, t)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <RowControls
        noun="ROW"
        onAdd={() => onPatch((x) => { x.rows.push(Array(x.rows[0] ? x.rows[0].length : 3).fill("")); })}
        onRemove={() => onPatch((x) => { if (x.rows.length > 2) x.rows.pop(); })}
      />
    </figure>
  );
}
