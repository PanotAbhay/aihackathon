import { EditableText } from "./EditableText.jsx";
import { BODY_FONT, MONO_OVERLINE } from "./articleStyles.js";

function initials(name) {
  return String(name || "NT").split(/\s+/).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase();
}

export function BylineBlock({ block, onPatch, readTime }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15, borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", padding: "16px 0", marginBottom: 8 }}>
      <div style={{ width: 48, height: 48, flex: "none", background: "var(--placeholder)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", color: "var(--muted)" }}>{initials(block.a)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <EditableText
          as="strong"
          data-ph="Reporter name"
          value={block.a}
          onCommit={(v) => onPatch((x) => { x.a = v; })}
          style={{ fontFamily: BODY_FONT, fontSize: "var(--sans-body)", fontWeight: 700, color: "var(--ink)" }}
        />
        <EditableText
          as="span"
          data-ph="Desk"
          value={block.b}
          onCommit={(v) => onPatch((x) => { x.b = v; })}
          style={{ fontFamily: BODY_FONT, fontSize: 13, color: "var(--muted)" }}
        />
      </div>
      <div style={{ marginLeft: "auto", ...MONO_OVERLINE, color: "var(--muted-light)" }}>{readTime} MIN READ</div>
    </div>
  );
}
