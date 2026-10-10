import { EditableText } from "./EditableText.jsx";
import { BODY_TEXT } from "./articleStyles.js";

const LIST_TEXT = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--sans-body)",
  lineHeight: 1.8,
  color: "var(--ink-body)",
  margin: "0 0 18px",
};

const TEXT_VARIANTS = {
  h1: {
    as: "h1",
    placeholder: "Headline",
    style: { fontFamily: "var(--font-serif)", fontSize: "var(--serif-display)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "var(--serif-display-ls)", color: "var(--ink)", margin: "0 0 20px", textWrap: "balance" },
  },
  standfirst: {
    as: "p",
    placeholder: "Standfirst — one or two sentences",
    style: { fontFamily: "var(--font-sans)", fontSize: "var(--sans-lead)", lineHeight: 1.55, color: "var(--ink-secondary)", margin: "0 0 24px", textWrap: "pretty" },
  },
  h2: {
    as: "h2",
    placeholder: "Sub-heading",
    style: { fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em", color: "var(--ink)", margin: "44px 0 18px", textWrap: "balance" },
  },
  h3: {
    as: "h3",
    placeholder: "Smaller sub-heading",
    style: { fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, letterSpacing: "var(--sans-body-ls)", color: "var(--ink)", margin: "32px 0 14px" },
  },
  body: { as: "p", placeholder: "Body paragraph", style: BODY_TEXT },
  dropcap: { as: "p", placeholder: "Opening paragraph", dropcap: true, style: { display: "flow-root", ...BODY_TEXT } },
  bullets: { as: "ul", style: { ...LIST_TEXT, paddingLeft: 22, listStyle: "disc" } },
  numbered: { as: "ol", style: { ...LIST_TEXT, paddingLeft: 24, listStyle: "decimal" } },
};

export function TextBlock({ block, onPatch }) {
  const variant = TEXT_VARIANTS[block.type];
  return (
    <EditableText
      as={variant.as}
      html
      data-dropcap={variant.dropcap ? "" : undefined}
      data-ph={variant.placeholder}
      value={block.html}
      onCommit={(v) => onPatch((x) => { x.html = v; })}
      style={variant.style}
    />
  );
}
