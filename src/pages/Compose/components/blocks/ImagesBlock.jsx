import { pickFile } from "../../../../utils/fileReaders.js";
import { EditableText } from "./EditableText.jsx";
import { FIGURE, MONO_OVERLINE } from "./articleStyles.js";

const SLOT_HEIGHTS = { 1: 340, 2: 250 };

function slotStyle(src, height) {
  return {
    height,
    background: src ? "var(--placeholder) center/cover no-repeat url(" + src + ")" : "var(--placeholder)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "1px dashed " + (src ? "transparent" : "var(--rule)"),
  };
}

export function ImagesBlock({ block, theme, onPatch, onDragEnd }) {
  const slots = block.slots || [""];
  const n = slots.length;
  const height = SLOT_HEIGHTS[n] || 180;

  function readImage(index, file) {
    const reader = new FileReader();
    reader.onload = () => onPatch((x) => { x.slots[index] = reader.result; });
    reader.readAsDataURL(file);
  }

  function handleDrop(e, index) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && /^image\//.test(f.type)) readImage(index, f);
    onDragEnd();
  }

  return (
    <figure style={{ ...FIGURE, ...theme.figure }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + n + ",1fr)", gap: n > 2 ? 12 : 16 }}>
        {slots.map((src, i) => (
          <div
            key={block.id + "s" + i}
            title="Click or drop a photo"
            style={slotStyle(src, height)}
            onClick={(e) => { e.stopPropagation(); pickFile("image/*", (f) => readImage(i, f)); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => handleDrop(e, i)}
          >
            {!src && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)", textAlign: "center", padding: "0 12px" }}>DROP PHOTO<br />OR CLICK</span>
            )}
          </div>
        ))}
      </div>
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
    </figure>
  );
}
