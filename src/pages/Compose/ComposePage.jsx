import { useState, useRef } from "react";
import { useFlash } from "../../hooks/useFlash.js";
import { useDocument } from "../../hooks/useDocument.js";
import { useZoom } from "../../hooks/useZoom.js";
import { useAiSettings } from "../../hooks/useAiSettings.js";
import { useFontSettings } from "../../hooks/useFontSettings.js";
import { useSelectionBar } from "../../hooks/useSelectionBar.js";
import { useShortcuts } from "../../hooks/useShortcuts.js";
import { useBlockDrag } from "../../hooks/useBlockDrag.js";
import { useImport } from "../../hooks/useImport.js";
import { useAiFill } from "../../hooks/useAiFill.js";
import { useExport } from "../../hooks/useExport.js";
import { useTemplate } from "../../hooks/useTemplate.js";
import { NEW_BLOCK, TEMPLATES } from "../../data/index.js";
import { createStarterBlocks, cloneBlock, nid, sectionEnd, mergeProse, countWords } from "../../utils/blocks.js";
import { blocksToLatex, texFileName } from "../../utils/latexExport.js";
import { makeZip } from "../../utils/zip.js";
import { TopBar } from "./components/TopBar.jsx";
import { IconRail } from "./components/IconRail.jsx";
import { ElementsPanel } from "./components/ElementsPanel.jsx";
import { Canvas } from "./components/Canvas.jsx";
import { FormatToolbar } from "./components/FormatToolbar.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { ImportModal } from "./components/ImportModal.jsx";
import { TemplatePicker } from "./components/TemplatePicker.jsx";
import "./ComposePage.css";

export function ComposePage() {
  const { note, noteErr, setNoteErr, flash } = useFlash();
  const doc = useDocument(flash);
  const { zoom, zoomIn, zoomOut } = useZoom();
  const { aiConfig, saveAi } = useAiSettings();
  const fonts = useFontSettings();
  const [bar, setBar] = useSelectionBar();
  const templates = useTemplate();
  const { template } = templates;

  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("Feature Story");
  // Where palette clicks insert; tracked without re-rendering on every caret move.
  const caretIdxRef = useRef(null);

  function insertBlock(index, block) {
    const id = doc.insertAt(index, block);
    drag.clearDrop();
    return id;
  }

  const filler = useAiFill({ getBlocks: doc.getBlocks, save: doc.save, flash, aiConfig, rules: template.aiRules });
  const drag = useBlockDrag({ getBlocks: doc.getBlocks, save: doc.save, insertBlock, onFill: filler.fillFromText });
  const importer = useImport({ busy, setBusy, flash, aiConfig, save: doc.save, setNoteErr, template, onTemplate: templates.applyTemplate });
  const exporter = useExport({ docTitle, fonts: fonts.fonts, flash });

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

  function handleExportTex() {
    const blocks = doc.getBlocks();
    const { tex, images } = blocksToLatex(blocks);
    const name = texFileName(blocks);
    const blob = images.length
      ? makeZip([{ name: "main.tex", data: new TextEncoder().encode(tex) }, ...images])
      : new Blob([tex], { type: "application/x-tex" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name + (images.length ? ".zip" : ".tex");
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    flash(images.length
      ? "EXPORTED " + name.toUpperCase() + ".ZIP WITH " + images.length + " PHOTO" + (images.length > 1 ? "S" : "") + " — UPLOAD TO OVERLEAF"
      : "EXPORTED " + name.toUpperCase() + ".TEX");
  }

  function handleReset() {
    if (window.confirm("Clear the article and start over from the " + template.label + " starter page?")) doc.save(createStarterBlocks(template.key));
  }

  function handlePickTemplate(key) {
    doc.save(createStarterBlocks(key));
    templates.applyTemplate(key);
    templates.closePicker();
    setSel(null);
    flash("STARTED A " + TEMPLATES[key].label.toUpperCase() + " PAGE — CTRL+Z FOR THE PREVIOUS ONE");
  }

  function handleSwitchTemplate(key) {
    templates.applyTemplate(key);
    flash("SWITCHED TO " + TEMPLATES[key].label.toUpperCase() + " — YOUR TEXT IS UNCHANGED");
  }

  return (
    <div data-shell="" className="compose-shell" style={{ zoom, height: `calc(100vh / ${zoom})` }}>
      <TopBar
        docTitle={docTitle}
        onDocTitle={setDocTitle}
        templateKey={template.key}
        onTemplate={handleSwitchTemplate}
        note={note}
        noteErr={noteErr}
        busy={busy || filler.building.length > 0}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        exported={exporter.exported}
        exporting={exporter.exporting}
        onExport={exporter.copyHtml}
        onDownloadHtml={exporter.downloadHtml}
        onExportTex={template.theme.texExport ? handleExportTex : null}
        onImport={importer.openImport}
      />

      <div className="compose-body">
        <IconRail
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(!panelOpen)}
          onTemplates={templates.openPicker}
          onImport={importer.openImport}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={exporter.copyHtml}
          onSettings={() => setSettingsOpen(true)}
          onReset={handleReset}
        />
        <ElementsPanel
          open={panelOpen}
          allowed={template.blocks}
          onInsert={handleInsertFromPalette}
          onDragStart={drag.startNewDrag}
          onDragEnd={drag.clearDrop}
        />
        <div className="compose-workspace">
          <Canvas
            blocks={doc.blocks}
            sel={sel}
            building={filler.building}
            look={template.look}
            theme={template.theme}
            allowed={template.blocks}
            drop={drag.drop}
            readTime={Math.max(1, Math.round(countWords(doc.blocks) / 220))}
            onClearSel={handleClearSel}
            onSelect={handleSelect}
            onCaret={(index) => { caretIdxRef.current = index; }}
            onPatch={doc.patch}
            onDelete={handleDelete}
            onDeleteSection={handleDeleteSection}
            onDuplicate={handleDuplicate}
            onCommitProse={handleCommitProse}
            onShowDrop={drag.showDrop}
            onDropAt={drag.dropAt}
            onMoveStart={drag.startMoveDrag}
            onDragEnd={drag.clearDrop}
          />
        </div>
      </div>

      {bar && <FormatToolbar bar={bar} zoom={zoom} />}

      {settingsOpen && (
        <SettingsModal aiConfig={aiConfig} onSave={saveAi} fonts={fonts} onClose={() => setSettingsOpen(false)} />
      )}

      {importer.importOpen && <ImportModal importer={importer} busy={busy} noteErr={noteErr} />}

      {templates.pickerOpen && (
        <TemplatePicker currentKey={template.key} onPick={handlePickTemplate} onClose={templates.closePicker} />
      )}
    </div>
  );
}
