import { pickFile, prepareImage } from "../../../../utils/fileReaders.js";
import { EditableText } from "./EditableText.jsx";
import { Caption } from "./Caption.jsx";
import { FIGURE, MONO_OVERLINE } from "./articleStyles.js";

const SLOT_HEIGHTS = { 1: 340, 2: 250 };

const SUBFIGURE = "abcdefgh";

function slotStyle(src, height, placeholder) {
  return {
    height,
    background: src ? "var(--placeholder) center/cover no-repeat url(" + src + ")" : "var(--placeholder)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "1px dashed " + (src ? "transparent" : "var(--rule)"),
    ...(!src && placeholder),
  };
}

export function ImagesBlock({ block, theme, number, onPatch, onDragEnd, onNotice }) {
  const slots = block.slots || [""];
  const n = slots.length;
  const height = SLOT_HEIGHTS[n] || 180;

  async function readImage(index, file) {
    try {
      const src = await prepareImage(file);
      onPatch((x) => { x.slots[index] = src; });
    } catch {
      onNotice("COULDN’T READ THAT IMAGE — USE A JPEG OR PNG (EXPORT IPHONE HEIC PHOTOS AS JPEG)", true);
    }
  }

  // Only photo files are caught here; dragged blocks pass through to the canvas.
  function hasFiles(e) {
    return Array.from(e.dataTransfer.types || []).includes("Files");
  }

  function handleDrop(e, index) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    // Some formats (e.g. HEIC) arrive without a MIME type, so try any file and report failures.
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) readImage(index, f);
    onDragEnd();
  }

  return (
    <figure style={{ ...FIGURE, ...theme.figure }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + n + ",1fr)", gap: n > 2 ? 12 : 16 }}>
        {slots.map((src, i) => (
          <div
            key={block.id + "s" + i}
            title="Click or drop a photo"
            style={slotStyle(src, height, theme.imageSlot && theme.imageSlot.empty)}
            onClick={(e) => { e.stopPropagation(); pickFile("image/*", (f) => readImage(i, f)); }}
            onDragOver={(e) => { if (hasFiles(e)) { e.preventDefault(); e.stopPropagation(); } }}
            onDrop={(e) => handleDrop(e, i)}
          >
            {!src && !theme.imageSlot && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)", textAlign: "center", padding: "0 12px" }}>DROP PHOTO<br />OR CLICK</span>
            )}
            {!src && theme.imageSlot && <span style={theme.imageSlot.text}>Image — click or drop a file</span>}
          </div>
        ))}
      </div>
      {/* LaTeX subfigures: (a), (b), (c) under each image of a pair or gallery. */}
      {theme.captions && slots.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + n + ",1fr)", gap: n > 2 ? 12 : 16, marginTop: 6 }}>
          {slots.map((_, i) => (
            <div key={i} style={{ textAlign: "center", fontFamily: "var(--body-font)", fontSize: "var(--body-size)", color: "var(--ink)" }}>({SUBFIGURE[i]})</div>
          ))}
        </div>
      )}
      {theme.captions && (
        <Caption kind="Figure" number={number} value={block.a} onCommit={(v) => onPatch((x) => { x.a = v; })} style={{ marginTop: 10 }} />
      )}
      {!theme.captions && (
        <figcaption style={{ display: "flex", gap: 18, justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
          <EditableText
            as="span"
            data-ph="Caption"
            value={block.a}
            onCommit={(v) => onPatch((x) => { x.a = v; })}
            style={{ flex: 1, ...MONO_OVERLINE, color: "var(--muted)", lineHeight: 1.6 }}
          />
          <EditableText
            as="span"
            data-ph="CREDIT"
            value={block.b}
            onCommit={(v) => onPatch((x) => { x.b = v; })}
            style={{ whiteSpace: "nowrap", ...MONO_OVERLINE, color: "var(--muted-light)" }}
          />
        </figcaption>
      )}
    </figure>
  );
}
