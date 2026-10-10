import { EditableText } from "./EditableText.jsx";

// pgfplots' default look, for the LaTeX template: a full axis box with inward ticks, numeric
// y ticks, Computer Modern labels and the default blue plot style. Values, tick labels and the
// axis label stay editable in place.
const PLOT_HEIGHT = 190;
const LEFT = 52; // room for the y label and tick labels
const BOTTOM = 30; // room for the x tick labels

// Long labels rotate like pgfplots' "x tick label style={rotate=45, anchor=east}" instead of colliding.
export function rotatedLabels(rows) {
  const longest = Math.max(0, ...rows.map((r) => String(r.label || "").length));
  return longest * rows.length > 36;
}
const AXIS = "0.8px solid #000000";
const BLUE = "#0000FF";
const BLUE_FILL = "#B3B3FF"; // blue!30!white
const TICK = 5;
const TEXT = { fontFamily: "var(--body-font)", fontSize: 12.5, color: "#000000", letterSpacing: "0", lineHeight: 1 };

// "Nice" y ticks (steps of 1, 2 or 5 × 10^k), starting at zero like ymin=0.
function niceTicks(max) {
  const top = max > 0 ? max : 1;
  const raw = top / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  let ymax = Math.ceil(top / step) * step;
  // Leave headroom for the value labels above the highest point, as pgfplots does.
  if (top / ymax > 0.88) ymax += step;
  const ticks = [];
  for (let t = 0; t <= ymax + step / 2; t += step) ticks.push(Number(t.toPrecision(6)));
  return { ticks, ymax };
}

function formatTick(t) {
  return String(Number(t.toPrecision(4)));
}

// x position (fraction of the axis width) of data point i: bars get a half-slot margin
// (enlarge x limits), line plots a 5% margin.
function xAt(kind, i, n) {
  if (kind === "bar") return (i + 0.5) / n;
  return n === 1 ? 0.5 : 0.05 + (0.9 * i) / (n - 1);
}

export function PgfPlot({ kind, block, onPatch }) {
  const rows = block.bars || [];
  const n = Math.max(1, rows.length);
  const { ticks, ymax } = niceTicks(Math.max(0, ...rows.map((r) => Number(r.value) || 0)));
  const yAt = (v) => Math.max(0, Math.min(1, (Number(v) || 0) / ymax));
  const setValue = (i) => (v) => onPatch((x) => { x.bars[i].value = parseFloat(String(v).replace(/[^\d.-]/g, "")) || 0; });
  const setLabel = (i) => (v) => onPatch((x) => { x.bars[i].label = v; });
  const rotate = rotatedLabels(rows);
  const bottom = rotate ? BOTTOM + 8 + Math.max(0, ...rows.map((r) => String(r.label || "").length)) * 5 : BOTTOM;

  return (
    <div style={{ position: "relative", height: PLOT_HEIGHT + bottom, paddingLeft: LEFT }}>
      {/* y label, rotated like pgfplots' ylabel */}
      <div style={{ position: "absolute", left: 0, top: 0, height: PLOT_HEIGHT, width: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <EditableText
          as="span"
          data-ph="unit"
          value={block.b}
          onCommit={(v) => onPatch((x) => { x.b = v; })}
          style={{ ...TEXT, display: "block", whiteSpace: "nowrap", transform: "rotate(-90deg)" }}
        />
      </div>

      <div style={{ position: "relative", height: PLOT_HEIGHT, border: AXIS }}>
        {/* y ticks: labels outside, tick marks inside on both sides */}
        {ticks.map((t) => (
          <div key={t} style={{ position: "absolute", left: 0, right: 0, bottom: yAt(t) * 100 + "%", height: 0 }}>
            <span style={{ ...TEXT, position: "absolute", right: "calc(100% + 6px)", transform: "translateY(-50%)" }}>{formatTick(t)}</span>
            <span style={{ position: "absolute", left: 0, width: TICK, borderTop: AXIS }}></span>
            <span style={{ position: "absolute", right: 0, width: TICK, borderTop: AXIS }}></span>
          </div>
        ))}

        {/* x tick marks at each data point, bottom and top */}
        {rows.map((r, i) => (
          <div key={"xt" + i}>
            <span style={{ position: "absolute", bottom: 0, left: xAt(kind, i, n) * 100 + "%", height: TICK, borderLeft: AXIS }}></span>
            <span style={{ position: "absolute", top: 0, left: xAt(kind, i, n) * 100 + "%", height: TICK, borderLeft: AXIS }}></span>
          </div>
        ))}

        {kind === "bar" && rows.map((r, i) => (
          <div
            key={block.id + "b" + i}
            style={{ position: "absolute", bottom: 0, left: "calc(" + xAt(kind, i, n) * 100 + "% - 11px)", width: 22, height: yAt(r.value) * 100 + "%", background: BLUE_FILL, border: "0.8px solid " + BLUE, boxSizing: "border-box" }}
          >
            {/* nodes near coords */}
            <EditableText
              as="span"
              value={String(r.value)}
              onCommit={setValue(i)}
              style={{ ...TEXT, fontSize: 11.5, position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
            />
          </div>
        ))}

        {kind === "line" && (
          <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
              <polyline
                points={rows.map((r, i) => xAt(kind, i, n) * 100 + "," + (100 - yAt(r.value) * 100)).join(" ")}
                fill="none"
                stroke={BLUE}
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {rows.map((r, i) => (
              <div
                key={block.id + "p" + i}
                style={{ position: "absolute", left: xAt(kind, i, n) * 100 + "%", bottom: yAt(r.value) * 100 + "%", width: 6, height: 6, marginLeft: -3, marginBottom: -3, borderRadius: "50%", background: BLUE }}
              >
                <EditableText
                  as="span"
                  value={String(r.value)}
                  onCommit={setValue(i)}
                  style={{ ...TEXT, fontSize: 11.5, position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
                />
              </div>
            ))}
          </>
        )}

        {/* x tick labels */}
        {rows.map((r, i) => (
          <EditableText
            key={block.id + "l" + i}
            as="span"
            data-ph="label"
            value={r.label}
            onCommit={setLabel(i)}
            style={rotate
              ? { ...TEXT, position: "absolute", top: "calc(100% + 6px)", left: xAt(kind, i, n) * 100 + "%", transform: "translateX(-100%) rotate(-45deg)", transformOrigin: "right top", whiteSpace: "nowrap" }
              : { ...TEXT, position: "absolute", top: "calc(100% + 7px)", left: xAt(kind, i, n) * 100 + "%", transform: "translateX(-50%)", whiteSpace: "nowrap", textAlign: "center" }}
          />
        ))}
      </div>
    </div>
  );
}
