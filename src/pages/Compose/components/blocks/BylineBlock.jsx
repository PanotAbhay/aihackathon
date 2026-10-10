import { EditableText } from "./EditableText.jsx";
import { BODY_FONT, MONO_OVERLINE } from "./articleStyles.js";

function initials(name) {
  return String(name || "NT").split(/\s+/).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase();
}

function NameField({ block, onPatch, style }) {
  return (
    <EditableText
      as="strong"
      data-ph="Author name"
      value={block.a}
      onCommit={(v) => onPatch((x) => { x.a = v; })}
      style={{ fontFamily: BODY_FONT, fontSize: "var(--sans-body)", fontWeight: 700, color: "var(--ink)", ...style }}
    />
  );
}

function DeskField({ block, onPatch, style }) {
  return (
    <EditableText
      as="span"
      data-ph="Desk"
      value={block.b}
      onCommit={(v) => onPatch((x) => { x.b = v; })}
      style={{ fontFamily: BODY_FONT, fontSize: 13, color: "var(--muted)", ...style }}
    />
  );
}

// News: centred "By …" line under the headline, front-page style.
function CenteredByline({ block, onPatch, readTime }) {
  return (
    <div style={{ textAlign: "center", padding: "4px 0 22px", marginBottom: 12, borderBottom: "1px solid var(--rule)" }}>
      <div style={{ fontFamily: BODY_FONT, fontSize: 14, color: "var(--ink)", marginBottom: 6 }}>
        <span>By </span>
        <NameField block={block} onPatch={onPatch} style={{ fontSize: 14 }} />
      </div>
      <div style={{ ...MONO_OVERLINE, color: "var(--muted)" }}>
        <DeskField block={block} onPatch={onPatch} style={{ ...MONO_OVERLINE, fontSize: "var(--mono-overline)" }} />
        <span> · {readTime} MIN READ</span>
      </div>
    </div>
  );
}

// Finance: one compact ruled row.
function InlineByline({ block, onPatch, readTime }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", padding: "10px 0", marginBottom: 16 }}>
      <NameField block={block} onPatch={onPatch} style={{ color: "var(--red)", fontSize: 14 }} />
      <DeskField block={block} onPatch={onPatch} />
      <div style={{ marginLeft: "auto", ...MONO_OVERLINE, color: "var(--muted)" }}>{readTime} MIN READ</div>
    </div>
  );
}

// Research: authors and affiliation, no avatar.
function PlainByline({ block, onPatch, readTime }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, paddingBottom: 18, marginBottom: 24, borderBottom: "1px solid var(--rule)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <NameField block={block} onPatch={onPatch} style={{ fontSize: 15 }} />
        <DeskField block={block} onPatch={onPatch} style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14 }} />
      </div>
      <div style={{ marginLeft: "auto", ...MONO_OVERLINE, color: "var(--muted-light)" }}>{readTime} MIN READ</div>
    </div>
  );
}

// Lab manual: course details as a mono header strip.
function MonoByline({ block, onPatch, readTime }) {
  const field = { ...MONO_OVERLINE, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink)" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, borderTop: "1.5px solid var(--ink)", borderBottom: "1.5px solid var(--ink)", padding: "10px 0", marginBottom: 20 }}>
      <NameField block={block} onPatch={onPatch} style={{ ...field, fontWeight: 700 }} />
      <DeskField block={block} onPatch={onPatch} style={{ ...field, color: "var(--ink-secondary)" }} />
      <div style={{ marginLeft: "auto", ...field, color: "var(--red)" }}>{readTime} MIN READ</div>
    </div>
  );
}

// LaTeX: \maketitle's centred author, affiliation and \today, all \large (12pt).
function LatexByline({ block, onPatch }) {
  const text = { fontFamily: "var(--font-serif)", letterSpacing: "0", color: "var(--ink)", fontWeight: 400 };
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <NameField block={block} onPatch={onPatch} style={{ ...text, fontSize: 16, lineHeight: 1.17, display: "block" }} />
      <DeskField block={block} onPatch={onPatch} style={{ ...text, fontSize: 16, lineHeight: 1.17, display: "block", marginBottom: 13 }} />
      <div style={{ ...text, fontSize: 16, lineHeight: 1.17 }}>{today}</div>
    </div>
  );
}

const VARIANTS = { centered: CenteredByline, inline: InlineByline, plain: PlainByline, mono: MonoByline, latex: LatexByline };

export function BylineBlock({ block, theme, onPatch, readTime }) {
  const Variant = VARIANTS[theme.byline?.variant];
  if (Variant) return <Variant block={block} onPatch={onPatch} readTime={readTime} />;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15, borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", padding: "16px 0", marginBottom: 8 }}>
      <div style={{ width: 48, height: 48, flex: "none", background: "var(--placeholder)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", color: "var(--muted)" }}>{initials(block.a)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NameField block={block} onPatch={onPatch} />
        <DeskField block={block} onPatch={onPatch} />
      </div>
      <div style={{ marginLeft: "auto", ...MONO_OVERLINE, color: "var(--muted-light)" }}>{readTime} MIN READ</div>
    </div>
  );
}
