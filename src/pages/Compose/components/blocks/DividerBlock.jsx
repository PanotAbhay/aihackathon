const DEFAULT_TEXT = "░▒▓█▓▒░";

export function DividerBlock({ theme }) {
  const t = theme.divider || {};
  return (
    <div style={{ margin: "36px 0", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: "0.3em", color: "var(--rule)", ...t.style }}>
      {t.text ?? DEFAULT_TEXT}
    </div>
  );
}
