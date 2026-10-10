import "./ModalShell.css";

// `docked` pins the card to the right edge over a clear, click-through overlay,
// for settings whose effect should stay visible on the page behind.
export function ModalShell({ variant, docked, children }) {
  const dock = docked ? " modal-overlay--docked" : "";
  return (
    <div className={`modal-overlay modal-overlay--${variant}${dock}`}>
      <div className={`modal-card modal-card--${variant}`}>{children}</div>
    </div>
  );
}
