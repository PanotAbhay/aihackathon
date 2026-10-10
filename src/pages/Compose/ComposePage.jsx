import { useState, useRef } from "react";
import { useFlash } from "../../hooks/useFlash.js";
import { useDocument } from "../../hooks/useDocument.js";
import { useZoom } from "../../hooks/useZoom.js";
import { useAiSettings } from "../../hooks/useAiSettings.js";
import { useSelectionBar } from "../../hooks/useSelectionBar.js";
import { useShortcuts } from "../../hooks/useShortcuts.js";
import { useBlockDrag } from "../../hooks/useBlockDrag.js";
import { useImport } from "../../hooks/useImport.js";
import { useRewrite } from "../../hooks/useRewrite.js";
import { useSuggest } from "../../hooks/useSuggest.js";
import { NEW_BLOCK } from "../../data/index.js";
import { createStarterBlocks, cloneBlock, nid, sectionEnd, mergeProse, countWords } from "../../utils/blocks.js";
import { articleHtml } from "../../utils/exportHtml.js";
import { TopBar } from "./components/TopBar.jsx";
import { IconRail } from "./components/IconRail.jsx";
import { ElementsPanel } from "./components/ElementsPanel.jsx";
import { Canvas } from "./components/Canvas.jsx";
import { FormatToolbar } from "./components/FormatToolbar.jsx";
import { RewriteModal } from "./components/RewriteModal.jsx";
import { SuggestModal } from "./components/SuggestModal.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { ImportModal } from "./components/ImportModal.jsx";
import "./ComposePage.css";

export function ComposePage() {
  const { note, noteErr, setNoteErr, flash } = useFlash();
  const doc = useDocument(flash);
  const { zoom, zoomIn, zoomOut } = useZoom();
  const { aiConfig, saveAi } = useAiSettings();
  const [bar, setBar] = useSelectionBar();

  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("Feature Story");
  const [exported, setExported] = useState(false);
  // Where palette clicks insert; tracked without re-rendering on every caret move.
  const caretIdxRef = useRef(null);

  function insertBlock(index, block) {
    doc.insertAt(index, block);
    drag.clearDrop();
  }

  const drag = useBlockDrag({ getBlocks: doc.getBlocks, save: doc.save, insertBlock });
  const ai = { busy, setBusy, flash, aiConfig, setBar };
  const importer = useImport({ ...ai, save: doc.save, setNoteErr });
  const rewriter = useRewrite({ ...ai, getBlocks: doc.getBlocks, save: doc.save });
  const suggester = useSuggest({ ...ai, getBlocks: doc.getBlocks, insertBlock, sel });

  function handleUndo() {
    if (doc.undo()) setSel(null);
  }

  function handleRedo() {
    if (doc.redo()) setSel(null);
  }

  useShortcuts({
    onEscape: () => { setSel(null); setBar(null); },
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  function handleInsertFromPalette(item) {
    const n = doc.getBlocks().length;
    const at = Math.max(0, Math.min(n, caretIdxRef.current ?? n));
    insertBlock(at, NEW_BLOCK[item.type]());
    caretIdxRef.current = at + 1;
    flash("ADDED " + item.label.toUpperCase());
  }

  function handleSelect(id, index) {
    caretIdxRef.current = index + 1;
    setSel(id);
  }

  function handleDelete(id) {
    doc.save(doc.getBlocks().filter((x) => x.id !== id));
    if (sel === id) setSel(null);
  }

  function handleDeleteSection(id) {
    const cur = doc.getBlocks();
    const at = cur.findIndex((x) => x.id === id);
    if (at < 0) return;
    const end = sectionEnd(cur, at);
    if (!window.confirm("Delete this sub-heading and the " + (end - at - 1) + " blocks under it?")) return;
    const next = cur.slice();
    next.splice(at, end - at);
    doc.save(next);
    setSel(null);
  }

  function handleDuplicate(id) {
    const cur = doc.getBlocks();
    const at = cur.findIndex((x) => x.id === id);
    if (at < 0) return;
    const end = sectionEnd(cur, at);
    const copies = cur.slice(at, end).map((x) => ({ ...cloneBlock(x), id: nid() }));
    const next = cur.slice();
    next.splice(end, 0, ...copies);
    doc.save(next);
  }

  function handleCommitProse(ids, node) {
    // A second blur on the same content must not re-split the same paragraphs.
    if (node.__ntLast === node.innerHTML) return;
    node.__ntLast = node.innerHTML;
    const next = mergeProse(doc.getBlocks(), ids, node);
    if (next) doc.save(next);
  }

  function handleClearSel(e) {
    // Background click only — clicks landing on a block keep their selection.
    if (e.target && e.target.closest && e.target.closest(".nt-blk")) return;
    const s = window.getSelection();
    if (s && !s.isCollapsed) return;
    if (sel || bar) { setSel(null); setBar(null); }
  }

  function handleExport() {
    const node = document.querySelector("[data-article]");
    if (!node) return;
    const html = articleHtml(node);
    function done() {
      setExported(true);
      setTimeout(() => setExported(false), 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(html).then(done, done);
    else done();
  }

  function handleReset() {
    if (window.confirm("Clear the article and start over?")) doc.save(createStarterBlocks());
  }

  return (
    <div data-shell="" className="compose-shell" style={{ zoom, height: `calc(100vh / ${zoom})` }}>
      <TopBar
        docTitle={docTitle}
        onDocTitle={setDocTitle}
        note={note}
        noteErr={noteErr}
        busy={busy}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        exported={exported}
        onExport={handleExport}
        onImport={importer.openImport}
      />

      <div className="compose-body">
        <IconRail
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(!panelOpen)}
          onImport={importer.openImport}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={handleExport}
          onSettings={() => setSettingsOpen(true)}
          onReset={handleReset}
        />
        <ElementsPanel
          open={panelOpen}
          onInsert={handleInsertFromPalette}
          onDragStart={drag.startNewDrag}
          onDragEnd={drag.clearDrop}
        />
        <div className="compose-workspace">
          <Canvas
            blocks={doc.blocks}
            sel={sel}
            drop={drag.drop}
            readTime={Math.max(1, Math.round(countWords(doc.blocks) / 220))}
            onClearSel={handleClearSel}
            onSelect={handleSelect}
            onCaret={(index) => { caretIdxRef.current = index; }}
            onPatch={doc.patch}
            onDelete={handleDelete}
            onDeleteSection={handleDeleteSection}
            onDuplicate={handleDuplicate}
            onSuggest={suggester.openSuggestFor}
            onCommitProse={handleCommitProse}
            onShowDrop={drag.showDrop}
            onDropAt={drag.dropAt}
            onMoveStart={drag.startMoveDrag}
            onDragEnd={drag.clearDrop}
          />
        </div>
      </div>

      {bar && (
        <FormatToolbar
          bar={bar}
          zoom={zoom}
          onRewrite={rewriter.openRewrite}
          onSuggest={suggester.openSuggest}
        />
      )}

      {rewriter.rewrite && (
        <RewriteModal
          rewrite={rewriter.rewrite}
          busy={busy}
          onText={rewriter.setRewriteText}
          onRun={rewriter.runRewrite}
          onClose={rewriter.closeRewrite}
        />
      )}

      {suggester.suggest && (
        <SuggestModal
          suggest={suggester.suggest}
          busy={busy}
          onText={suggester.setSuggestText}
          onToggleReplace={suggester.toggleReplace}
          onRun={suggester.runSuggest}
          onClose={suggester.closeSuggest}
        />
      )}

      {settingsOpen && (
        <SettingsModal aiConfig={aiConfig} onSave={saveAi} onClose={() => setSettingsOpen(false)} />
      )}

      {importer.importOpen && <ImportModal importer={importer} busy={busy} noteErr={noteErr} />}
    </div>
  );
}
