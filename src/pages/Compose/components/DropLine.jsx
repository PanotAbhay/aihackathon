// Inline because it sits inside the exported article markup (hidden at opacity 0).
export function DropLine({ visible, top = -6, left, width, raised = false }) {
  return (
    <div
      style={{
        position: "absolute",
        ...(width != null ? { left: left - 8, width: width + 16 } : { left: -8, right: -8 }),
        top,
        height: 2,
        borderRadius: 2,
        background: "#C9A227",
        boxShadow: "0 0 8px rgba(201,162,39,0.55)",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        ...(raised && { zIndex: 4 }),
      }}
    ></div>
  );
}
