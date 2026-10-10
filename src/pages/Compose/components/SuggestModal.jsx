import { ModalShell } from "./ModalShell.jsx";
import "./SuggestModal.css";

export function SuggestModal({ suggest, busy, onText, onToggleReplace, onRun, onClose }) {
  const multi = suggest.count > 1;

  function handleKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); onRun(); }
    if (e.key === "Escape") onClose();
  }

  return (
    <ModalShell variant="suggest">
      <div className="modal-head">
        <div className="modal-kicker modal-kicker--spaced">ADD AN ELEMENT HERE</div>
        <div className="modal-scope">{multi ? suggest.count + " PARAGRAPHS SELECTED — READ AS ONE PASSAGE" : "ONE PARAGRAPH SELECTED"}</div>
        <div className="modal-quote">{suggest.preview}…</div>
      </div>
      <div className="suggest-body">
        <label className="modal-label">WHAT SHOULD I ADD? (OPTIONAL)</label>
        <input
          className="modal-input"
          value={suggest.text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          placeholder="e.g. pull a quote about media framing"
        />
        <div className="modal-hint">Leave blank and it picks whatever the text best supports — a table, timeline, pull quote, stat row or chart.</div>
        {multi && (
          <div className="suggest-replace" onClick={onToggleReplace}>
            <span className="suggest-replace-box">{suggest.replace ? "☑" : "☐"}</span>
            <span className="suggest-replace-label">Replace the selected paragraphs with the new element</span>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn modal-btn--primary" onClick={onRun}>{busy ? "THINKING…" : "ADD IT"}</button>
      </div>
    </ModalShell>
  );
}
