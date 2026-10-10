import { EditableText } from "./EditableText.jsx";
import { RowControls } from "./RowControls.jsx";
import { BODY_FONT, FIGURE, MONO_OVERLINE } from "./articleStyles.js";

const HEAD_CELL = { textAlign: "left", padding: "0 8px 11px 0", ...MONO_OVERLINE, color: "var(--muted)" };

function rowStyle(ri) {
  if (ri === 0) return { borderBottom: "1px solid var(--rule)" };
  return { borderBottom: "1px solid var(--rule-light)", ...(ri % 2 === 0 && { background: "var(--paper-faint)" }) };
}

function cellStyle(ri, ci) {
  if (ri === 0) return HEAD_CELL;
  return {
    padding: "13px 8px 13px 0",
    fontFamily: BODY_FONT,
    fontSize: 14,
    color: ci === 0 ? "var(--ink)" : "var(--ink-body)",
    ...(ci === 0 && { fontWeight: 700 }),
  };
}

export function TableBlock({ block, onPatch }) {
  const rows = block.rows || [];

  return (
    <figure style={FIGURE}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={block.id + "t" + ri} style={rowStyle(ri)}>
              {cells.map((val, ci) => (
                <EditableText
                  as="td"
                  key={block.id + "t" + ri + "c" + ci}
                  data-ph="—"
                  value={val}
                  onCommit={(v) => onPatch((x) => { x.rows[ri][ci] = v; })}
                  style={cellStyle(ri, ci)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <RowControls
        noun="ROW"
        onAdd={() => onPatch((x) => { x.rows.push(["New row", "Detail", "Detail"]); })}
        onRemove={() => onPatch((x) => { if (x.rows.length > 2) x.rows.pop(); })}
      />
    </figure>
  );
}
