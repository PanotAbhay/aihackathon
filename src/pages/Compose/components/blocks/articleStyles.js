// Article blocks keep their styles inline: "Copy HTML" exports the article DOM
// as-is, so the markup has to carry its own styling to paste anywhere.

export const BODY_TEXT = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--sans-body)",
  lineHeight: 1.85,
  letterSpacing: "var(--sans-body-ls)",
  color: "var(--ink-body)",
  margin: "0 0 18px",
  textWrap: "pretty",
};

export const FIGURE = { margin: "32px 0" };

export const MONO_OVERLINE = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--mono-overline)",
  letterSpacing: "var(--mono-overline-ls)",
};

export const MONO_LABEL = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--mono-label)",
  letterSpacing: "var(--mono-label-ls)",
};

export function maxValue(rows) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return max <= 0 ? 100 : max;
}
