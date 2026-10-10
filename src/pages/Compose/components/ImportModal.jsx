import { ModalShell } from "./ModalShell.jsx";
import "./ImportModal.css";

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length.toLocaleString();
}

export function ImportModal({ importer, busy, noteErr }) {
  const { raw, setRaw, recovered, fileNote, importNote } = importer;

  return (
    <ModalShell variant="import">
      <div className="modal-head">
        <div className="modal-kicker">IMPORT ARTICLE</div>
        <div className="modal-desc">Paste the raw article. The AI picks the best template (News, Finance, Research or Lab manual) and structures it into headline, standfirst, sub-headings, quotes and data — without rewriting your copy.</div>
      </div>
      <div className="import-sources">
        <button className="import-source-btn" onClick={importer.pickDocFile}>
          <span className="ms import-source-icon">upload_file</span>Upload .docx / .pdf / .txt
        </button>
        {recovered.length > 200 && (
          <button className="import-source-btn import-source-btn--restore" title="Load the last article you imported" onClick={importer.restoreRecovered}>
            <span className="ms import-source-icon">history</span>{"Restore last article (" + wordCount(recovered) + " words)"}
          </button>
        )}
        <span className="import-file-note">{fileNote || "Or paste the text below."}</span>
      </div>
      <textarea
        className="import-textarea"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        spellCheck={false}
        placeholder="Paste the full article text here…"
      ></textarea>
      <div className="import-footer">
        <span className="import-note" style={{ color: noteErr ? "#E8836F" : "rgba(242,239,233,0.55)" }}>{importNote}</span>
        <button className="modal-btn" onClick={importer.closeImport}>Cancel</button>
        <button className="modal-btn" onClick={importer.importPlain}>Plain text only</button>
        <button className={`import-ai-btn${busy ? " import-ai-btn--busy" : ""}`} onClick={importer.importAi} disabled={busy}>
          <span className="ms import-source-icon">auto_awesome</span>{busy ? "Formatting…" : "Format with AI"}
        </button>
      </div>
    </ModalShell>
  );
}
