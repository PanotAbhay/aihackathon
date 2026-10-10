import { EditableText } from "./EditableText.jsx";
import { MONO_OVERLINE } from "./articleStyles.js";

export function QuoteBlock({ block, theme, onPatch }) {
  const t = theme.quote || {};
  return (
    <blockquote style={{ margin: "36px 0", padding: "0 0 0 26px", borderLeft: "2px solid var(--red)", ...t.wrap }}>
      <EditableText
        as="p"
        data-ph="Quote worth pulling out"
        value={block.a}
        onCommit={(v) => onPatch((x) => { x.a = v; })}
        style={{ fontFamily: "var(--font-serif)", fontSize: 28, lineHeight: 1.3, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0, textWrap: "balance", ...t.text }}
      />
      <EditableText
        as="cite"
        data-ph="Attribution"
        value={block.b}
        onCommit={(v) => onPatch((x) => { x.b = v; })}
        style={{ display: "block", fontStyle: "normal", ...MONO_OVERLINE, color: "var(--muted)", marginTop: 14, ...t.cite }}
      />
    </blockquote>
  );
}
