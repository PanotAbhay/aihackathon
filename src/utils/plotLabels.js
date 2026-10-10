// Tick-label layout shared by the on-screen pgfplots look (PgfPlot) and the .tex export, so a
// chart's labels rotate in the editor exactly when they will in the compiled PDF.

// Rough Latin Modern advance widths in em. Deterministic (pagination measures heights once).
export function textEm(text) {
  let w = 0;
  for (const ch of String(text || "")) {
    if (/[ijlft.,:;'!|()]/.test(ch)) w += 0.3;
    else if (/[mwMW]/.test(ch)) w += 0.92;
    else if (/[A-Z]/.test(ch)) w += 0.76;
    else if (ch === " ") w += 0.34;
    else w += 0.53;
  }
  return w;
}

// \linewidth on A4 with 1in margins, in pt: one column, or two with a 10pt \columnsep.
const LINE_WIDTH = { 1: 455, 2: 222.5 };
// Room the y label and y tick labels take from width=\linewidth.
const Y_AXIS_ROOM = 45;
// x tick labels are set in \small.
const LABEL_PT = 9;

// Whether x tick labels must rotate 45° (pgfplots' rotate=45, anchor=east) instead of colliding:
// a label wider than the space between neighbouring ticks rotates them all.
export function rotatedLabels(rows, { kind = "bar", columns = 1 } = {}) {
  const n = rows.length;
  if (!n) return false;
  const axis = (LINE_WIDTH[columns] || LINE_WIDTH[1]) - Y_AXIS_ROOM;
  // Bars sit in equal slots; line points span 90% of the axis.
  const spacing = kind === "line" && n > 1 ? (axis * 0.9) / (n - 1) : axis / n;
  const widest = Math.max(0, ...rows.map((r) => textEm(r.label))) * LABEL_PT;
  return widest > spacing * 0.9;
}

// How far (pt) rotated labels reach left past the room pgfplots keeps for the y axis, i.e. how much
// narrower the plot must be to stay inside \linewidth. Ticks sit where enlarge x limits puts them
// (0.15 for bars, 0.05 for lines).
export function labelOverhang(rows, { kind = "bar", columns = 1 } = {}) {
  if (!rotatedLabels(rows, { kind, columns })) return 0;
  const n = rows.length;
  const axis = (LINE_WIDTH[columns] || LINE_WIDTH[1]) - Y_AXIS_ROOM;
  const enlarge = kind === "line" ? 0.05 : 0.15;
  const at = (i) => (n === 1 ? 0.5 : (i + enlarge * (n - 1)) / ((1 + 2 * enlarge) * (n - 1)));
  // A label rotated 45° about its tick reaches 0.71 × (width + one em of padding) to the left.
  const reach = Math.max(...rows.map((r, i) => 0.71 * (textEm(r.label) + 1) * LABEL_PT - at(i) * axis));
  return Math.max(0, Math.ceil((reach - Y_AXIS_ROOM) * 1.25));
}
