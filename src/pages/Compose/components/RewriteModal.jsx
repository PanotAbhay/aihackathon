import { TONE_PRESETS } from "../../../data/index.js";
import { ModalShell } from "./ModalShell.jsx";
import "./RewriteModal.css";

function scopeLabel(rewrite) {
  if (rewrite.frag) return "SELECTED TEXT ONLY — THE REST OF THE PARAGRAPH IS UNTOUCHED";
  return rewrite.count > 1 ? rewrite.count + " PARAGRAPHS SELECTED" : "WHOLE PARAGRAPH SELECTED";
}

export function RewriteModal({ rewrite, busy, onText, onRun, onClose }) {
  function handleKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); onRun(rewrite.text); }
    if (e.key === "Escape") onClose();
  }

  return (
    <ModalShell variant="rewrite">
      <div className="modal-head modal-head--tall">
        <div className="modal-kicker modal-kicker--spaced">REWRITE THIS TEXT</div>
        <div className="modal-scope">{scopeLabel(rewrite)}</div>
        <div className="modal-quote">{rewrite.preview}…</div>
      </div>
      <div className="rewrite-body">
        <div className="modal-field">
          <label className="modal-label">QUICK</label>
          <div className="rewrite-presets">
            {TONE_PRESETS.map((p) => (
              <button key={p.key} className="rewrite-preset" onClick={() => onRun(p.hint)}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">OR SAY IT IN YOUR OWN WORDS</label>
          <input
            className="modal-input"
            value={rewrite.text}
            onChange={(e) => onText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            placeholder="e.g. rewrite as a single tighter paragraph for the top of the story"
          />
          <div className="modal-hint">Facts, figures and quotes are kept exactly as written. Ctrl+Z reverts the whole rewrite.</div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn modal-btn--primary" onClick={() => onRun(rewrite.text)}>{busy ? "REWRITING…" : "REWRITE"}</button>
      </div>
    </ModalShell>
  );
}
