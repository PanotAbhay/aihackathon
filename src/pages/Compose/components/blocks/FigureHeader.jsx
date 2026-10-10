import { EditableText } from "./EditableText.jsx";
import { MONO_OVERLINE } from "./articleStyles.js";

export function FigureHeader({ block, onPatch, titlePlaceholder, notePlaceholder, marginBottom }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, borderBottom: "1px solid var(--rule)", paddingBottom: 11, marginBottom }}>
      <EditableText
        as="span"
        data-ph={titlePlaceholder}
        value={block.a}
        onCommit={(v) => onPatch((x) => { x.a = v; })}
        style={{ fontFamily: "var(--font-sans)", fontSize: "var(--sans-body)", fontWeight: 700, color: "var(--ink)" }}
      />
      <EditableText
        as="span"
        data-ph={notePlaceholder}
        value={block.b}
        onCommit={(v) => onPatch((x) => { x.b = v; })}
        style={{ ...MONO_OVERLINE, color: "var(--muted-light)", whiteSpace: "nowrap" }}
      />
    </div>
  );
}
