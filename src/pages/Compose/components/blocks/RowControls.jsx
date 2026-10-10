import "./RowControls.css";

export function RowControls({ noun, onAdd, onRemove, className = "" }) {
  return (
    <div data-chrome="" className={`row-controls ${className}`}>
      <button className="row-controls-btn" onClick={(e) => { e.stopPropagation(); onAdd(); }}>+ {noun}</button>
      <button className="row-controls-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }}>− {noun}</button>
    </div>
  );
}
