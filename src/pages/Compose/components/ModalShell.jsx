import "./ModalShell.css";

export function ModalShell({ variant, children }) {
  return (
    <div className={`modal-overlay modal-overlay--${variant}`}>
      <div className={`modal-card modal-card--${variant}`}>{children}</div>
    </div>
  );
}
