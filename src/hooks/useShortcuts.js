import { useEffect, useRef } from "react";

export function useShortcuts({ onEscape, onUndo, onRedo }) {
  const handlersRef = useRef({ onEscape, onUndo, onRedo });

  useEffect(() => {
    handlersRef.current = { onEscape, onUndo, onRedo };
  });

  useEffect(() => {
    function handleKeyDown(e) {
      const handlers = handlersRef.current;
      if (e.key === "Escape") { handlers.onEscape(); return; }
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = String(e.key || "").toLowerCase();
      if (k !== "z" && k !== "y") return;
      e.preventDefault();
      if ((k === "z" && e.shiftKey) || k === "y") { handlers.onRedo(); return; }
      // Inside a text field, let the browser undo typing first.
      const ae = document.activeElement;
      if (ae && ae.isContentEditable) {
        const before = ae.innerHTML;
        document.execCommand("undo");
        if (ae.innerHTML !== before) return;
      }
      handlers.onUndo();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
