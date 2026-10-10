import { AI_MODELS, AI_PROVIDERS } from "../../../data/index.js";
import { ModalShell } from "./ModalShell.jsx";
import "./SettingsModal.css";

function providerNote(provider) {
  if (provider === "builtin") return "Works only inside the design tool. For a standalone copy, pick a provider below.";
  if (provider === "ollama") return "Calls Ollama on this machine at localhost:11434. No key needed; nothing leaves your computer.";
  return "Your key is stored only in this browser and sent straight to the provider. Don’t publish a copy of this file with a key saved in it.";
}

export function SettingsModal({ aiConfig, onSave, onClose }) {
  const needsKey = aiConfig.provider !== "builtin" && aiConfig.provider !== "ollama";

  return (
    <ModalShell variant="settings">
      <div className="modal-head">
        <div className="modal-kicker">AI MODEL</div>
        <div className="modal-desc">Which model does the formatting.</div>
      </div>
      <div className="settings-body">
        <div className="settings-field">
          <label className="modal-label">PROVIDER</label>
          <select
            className="modal-input settings-select"
            value={aiConfig.provider}
            onChange={(e) => onSave({ provider: e.target.value, model: AI_MODELS[e.target.value] || "" })}
          >
            {AI_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="settings-field">
          <label className="modal-label">MODEL</label>
          <input className="modal-input settings-mono" value={aiConfig.model} onChange={(e) => onSave({ model: e.target.value })} spellCheck={false} />
        </div>
        {needsKey && (
          <div className="settings-field">
            <label className="modal-label">API KEY</label>
            <input
              className="modal-input settings-mono"
              value={aiConfig.key}
              onChange={(e) => onSave({ key: e.target.value })}
              type="password"
              spellCheck={false}
              placeholder="sk-…"
            />
          </div>
        )}
        <div className="modal-quote">{providerNote(aiConfig.provider)}</div>
      </div>
      <div className="modal-footer">
        <button className="modal-btn modal-btn--primary" onClick={onClose}>Done</button>
      </div>
    </ModalShell>
  );
}
