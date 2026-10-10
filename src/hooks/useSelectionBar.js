import { useState, useEffect } from "react";

// Position of the inline format toolbar: above any non-empty selection inside an editable field.
export function useSelectionBar() {
  const [bar, setBar] = useState(null);

  useEffect(() => {
    function handleSelectionChange() {
      const s = window.getSelection();
      if (!s || s.isCollapsed || s.rangeCount === 0) { setBar(null); return; }
      let n = s.anchorNode;
      if (n && n.nodeType === 3) n = n.parentElement;
      if (!n || !n.closest || !n.closest('[contenteditable="true"]')) return;
      const r = s.getRangeAt(0).getBoundingClientRect();
      if (!r.width) return;
      setBar({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top - 8) });
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return [bar, setBar];
}
