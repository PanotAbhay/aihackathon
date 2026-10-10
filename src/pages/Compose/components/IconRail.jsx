import "./IconRail.css";

function RailButton({ icon, title, active, muted, onClick }) {
  const modifier = active ? " rail-btn--active" : (muted ? " rail-btn--muted" : "");
  return (
    <div className={`rail-btn${modifier}`} title={title} onClick={onClick}>
      <span className="ms rail-btn-icon">{icon}</span>
    </div>
  );
}

export function IconRail({ panelOpen, onTogglePanel, onImport, onUndo, onRedo, onExport, onSettings, onReset }) {
  return (
    <nav className="rail">
      <RailButton icon="add" title="Elements" active={panelOpen} onClick={onTogglePanel} />
      <RailButton icon="description" title="Import an article" onClick={onImport} />
      <RailButton icon="undo" title="Undo (Ctrl+Z)" onClick={onUndo} />
      <RailButton icon="redo" title="Redo (Ctrl+Shift+Z)" onClick={onRedo} />
      <RailButton icon="code_blocks" title="Copy the article HTML" onClick={onExport} />
      <div className="rail-spacer"></div>
      <RailButton icon="settings" title="AI model settings" muted onClick={onSettings} />
      <RailButton icon="restart_alt" title="Reset the document" muted onClick={onReset} />
      <div className="rail-avatar">RN</div>
    </nav>
  );
}
