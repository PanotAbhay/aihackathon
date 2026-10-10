import { useState } from "react";
import { AI_MODELS, AI_PROVIDERS } from "../../../data/index.js";
import { ModalShell } from "./ModalShell.jsx";
import { FontsPanel } from "./FontsPanel.jsx";
import "./SettingsModal.css";

const TABS = [
  { id: "ai", label: "AI MODEL" },
  { id: "fonts", label: "FONTS" },
];

function providerNote(provider) {
  if (provider === "builtin") return "Works only inside the design tool. For a standalone copy, pick a provider below.";
  if (provider === "ollama") return "Calls Ollama on this machine at localhost:11434. No key needed; nothing leaves your computer.";
  return "Your key is stored only in this browser and sent straight to the provider. Don’t publish a copy of this file with a key saved in it.";
}

function AiPanel({ aiConfig, onSave }) {
  const needsKey = aiConfig.provider !== "builtin" && aiConfig.provider !== "ollama";

  return (
    <>
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
    </>
  );
}

export function SettingsModal({ aiConfig, onSave, fonts, onClose }) {
  const [tab, setTab] = useState("ai");

  return (
    <ModalShell variant="settings" docked={tab === "fonts"}>
      <div className="settings-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={"settings-tab" + (tab === t.id ? " settings-tab--on" : "")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="settings-scroll">
        {tab === "fonts" ? <FontsPanel {...fonts} /> : <AiPanel aiConfig={aiConfig} onSave={onSave} />}
      </div>
      <div className="modal-footer">
        <button className="modal-btn modal-btn--primary" onClick={onClose}>Done</button>
      </div>
    </ModalShell>
  );
}
