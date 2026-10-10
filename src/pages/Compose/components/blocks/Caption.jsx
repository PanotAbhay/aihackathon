import { EditableText } from "./EditableText.jsx";

const CAPTION = { textAlign: "center", fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.45, letterSpacing: "0", color: "var(--ink)" };

// LaTeX-style numbered caption: "Figure 2: Estimated usable rooftop area." — the label is fixed, the text editable.
export function Caption({ kind, number, value, onCommit, placeholder = "Caption", unit, onUnit, style }) {
  return (
    <div style={{ ...CAPTION, ...style }}>
      <span>{kind} {number}: </span>
      <EditableText as="span" data-ph={placeholder} value={value} onCommit={onCommit} />
      {onUnit && (
        <>
          <span> (</span>
          <EditableText as="span" data-ph="unit" value={unit} onCommit={onUnit} />
          <span>)</span>
        </>
      )}
    </div>
  );
}
