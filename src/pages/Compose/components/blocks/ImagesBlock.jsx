import { pickFile, prepareImage } from "../../../../utils/fileReaders.js";
import { EditableText } from "./EditableText.jsx";
import { Caption } from "./Caption.jsx";
import { ImageSlot } from "./ImageSlot.jsx";
import { SLOT_ASPECT } from "../../../../utils/latexExport.js";
import { FIGURE, MONO_OVERLINE } from "./articleStyles.js";

const SLOT_HEIGHTS = { 1: 340, 2: 250 };

const SUBFIGURE = "abcdefgh";

export function ImagesBlock({ block, theme, number, onPatch, onDragEnd, onNotice }) {
  const slots = block.slots || [""];
  const n = slots.length;
  const height = SLOT_HEIGHTS[n] || 180;

  async function readImage(index, file) {
    try {
      const src = await prepareImage(file);
      // A new photo starts centred and unzoomed.
      onPatch((x) => {
        x.slots[index] = src;
        if (x.frames) x.frames[index] = null;
      });
    } catch {
      onNotice("COULDN’T READ THAT IMAGE — USE A JPEG OR PNG (EXPORT IPHONE HEIC PHOTOS AS JPEG)", true);
    }
  }

  // Some formats (e.g. HEIC) arrive without a MIME type, so any dropped file is tried and failures reported.
  function handleDropFile(index, file) {
    if (file) readImage(index, file);
    onDragEnd();
  }

  function saveFrame(index, frame) {
    onPatch((x) => {
      x.frames = Array.from({ length: x.slots.length }, (_, k) => (x.frames && x.frames[k]) || null);
      x.frames[index] = frame;
    });
  }

  return (
    <figure style={{ ...FIGURE, ...theme.figure }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + n + ",1fr)", gap: n > 2 ? 12 : 16 }}>
        {slots.map((src, i) => (
          <ImageSlot
            key={block.id + "s" + i}
            src={src}
            frame={block.frames && block.frames[i]}
            height={height}
            aspect={theme.imageSlot && theme.imageSlot.aspect ? SLOT_ASPECT[n] : null}
            emptyStyle={theme.imageSlot && theme.imageSlot.empty}
            onPick={() => pickFile("image/*", (f) => readImage(i, f))}
            onDropFile={(f) => handleDropFile(i, f)}
            onFrame={(frame) => saveFrame(i, frame)}
          >
            {!theme.imageSlot && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)", textAlign: "center", padding: "0 12px" }}>DROP PHOTO<br />OR CLICK</span>
            )}
            {theme.imageSlot && <span style={theme.imageSlot.text}>{theme.imageSlot.label}</span>}
          </ImageSlot>
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
