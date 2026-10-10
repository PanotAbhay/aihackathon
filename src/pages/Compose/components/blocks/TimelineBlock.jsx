import { EditableText } from "./EditableText.jsx";
import { RowControls } from "./RowControls.jsx";
import { BODY_FONT, MONO_OVERLINE } from "./articleStyles.js";

function dotStyle(last) {
  return {
    position: "absolute",
    left: -31,
    top: 5,
    width: 9,
    height: 9,
    borderRadius: "50%",
    ...(last ? { background: "var(--paper)", border: "1px solid var(--muted-light)" } : { background: "var(--muted-light)" }),
  };
}

export function TimelineBlock({ block, theme, onPatch }) {
  const rows = block.rows || [];
  const t = theme.timeline || {};

  function field(i, key) {
    return {
      value: rows[i][key],
      onCommit: (v) => onPatch((x) => { x.rows[i][key] = v; }),
    };
  }

  return (
    <>
      <div style={{ margin: "32px 0", borderLeft: "1px solid var(--rule)", paddingLeft: 26, display: "flex", flexDirection: "column", gap: 26, ...t.wrap }}>
        {rows.map((r, i) => (
          <div key={block.id + "e" + i} style={{ position: "relative" }}>
            <span style={dotStyle(i === rows.length - 1)}></span>
            <EditableText data-ph="DATE" {...field(i, "d")} style={{ ...MONO_OVERLINE, color: "var(--muted)", marginBottom: 5 }} />
            <EditableText data-ph="What happened" {...field(i, "t")} style={{ fontFamily: BODY_FONT, fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }} />
            <EditableText data-ph="Detail" {...field(i, "x")} style={{ fontFamily: BODY_FONT, fontSize: 14, lineHeight: 1.65, color: "var(--ink-secondary)" }} />
          </div>
        ))}
      </div>
      <RowControls
        noun="ENTRY"
        className="row-controls--timeline"
        onAdd={() => onPatch((x) => { x.rows.push({ d: "DATE", t: "What happened", x: "Detail." }); })}
        onRemove={() => onPatch((x) => { if (x.rows.length > 1) x.rows.pop(); })}
      />
    </>
  );
}
