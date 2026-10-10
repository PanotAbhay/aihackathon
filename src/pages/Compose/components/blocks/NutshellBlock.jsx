import { EditableText } from "./EditableText.jsx";
import { BODY_FONT } from "./articleStyles.js";

export function NutshellBlock({ block, theme, onPatch }) {
  const t = theme.nutshell || {};
  return (
    <div style={{ margin: "32px 0", background: "var(--paper-faint)", border: "1px solid var(--rule-light)", padding: "22px 24px", ...t.box }}>
      <EditableText
        data-ph="The Nutshell"
        value={block.a}
        onCommit={(v) => onPatch((x) => { x.a = v; })}
        style={{ fontFamily: BODY_FONT, fontSize: "var(--sans-body)", fontWeight: 700, color: "var(--ink)", marginBottom: 14, ...t.title }}
      />
      <EditableText
        as="ul"
        html
        value={block.html}
        onCommit={(v) => onPatch((x) => { x.html = v; })}
        style={{ listStyle: "disc", paddingLeft: 20, margin: 0, fontFamily: BODY_FONT, fontSize: "var(--sans-body)", lineHeight: 1.7, color: "var(--ink-soft)", ...t.list }}
      />
    </div>
  );
}
