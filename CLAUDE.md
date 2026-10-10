# CLAUDE.md

QMUL AI Hackathon team repo. The product is **Compose**, a visual feature builder for Nutshell Today (a Bangladesh news publication): import an article, have AI structure it, then edit it on the page. See README.md for the user-facing overview and file layout.

## Commands

```
npm install
npm run dev      # Vite dev server
npm run build    # must pass before committing
```

There are no tests or linter. Verify changes with `npm run build`, and for UI changes, open the app.

## Origin and visual fidelity

- `Compose (standalone).html` is the original single-file build (a compressed bundle with a custom template runtime). The React app is a port of it and was verified pixel-identical in headless Chrome.
- Keep the visuals identical to that HTML unless asked to change them. Copy colours, spacing and fonts exactly; don't "improve" them.
- The original's runtime ignored `style-hover` attributes, so the port deliberately has **no hover effects**. It also never rendered line-chart y-axis labels, so those are omitted too.
- Since the port, Rewrite and the AI "Add"/Suggest modal were removed on purpose. Don't reintroduce them.

## Architecture

- `src/pages/Compose/ComposePage.jsx` owns page state and wires hooks to components. Props and callbacks go down; there's no Context or Redux.
- `src/hooks/` holds one concern per hook. `useDocument` covers blocks, undo/redo and localStorage autosave. It exposes `getBlocks()` (backed by a ref) so async AI calls and blur handlers read the latest document. Use it rather than a stale `blocks` closure.
- `src/utils/` holds framework-free logic: AI providers (`ai.js`), prompts, docx/pdf readers, block transforms (`blocks.js`).
- `src/data/index.js` holds block factories (`NEW_BLOCK`), the palette, `AI_FILL_TYPES`, AI models and `STORAGE_KEYS`.
- **Templates** (`TEMPLATES` in `src/data/index.js`, state in `useTemplate`): each sets a canvas `look` (CSS variables on `.canvas`), a `theme` of per-element inline-style overrides passed down as the `theme` prop (`article`, `h1`, `body`, `byline.variant`, `quote`, `nutshell`, `table`, …; blocks spread `...theme.x` last), allowed `blocks` (filters the palette, the type menu and AI output), `aiRules` (appended to import and fill prompts) and a `starter` page. On AI import the model returns `"template"` and the app switches to it. The LaTeX paper template also uses theme flags `numbering` (section/figure/table numbers computed in `Canvas`), `captions` (numbered `Caption` instead of figure headers), `paragraphIndent`, `abstractLabel` and `texExport` (shows the Export .tex button; conversion in `utils/latexExport.js`, zipping in `utils/zip.js`). The top-bar menu switches template without touching content; the picker replaces the page with the template's starter (undoable).
- A document is a flat array of blocks: `{ id, type, html | a | b | slots | cells | bars | rows }`. Consecutive `body`/`dropcap` blocks render as one contentEditable `ProseBlock`.
- **Drag-to-AI-fill:** dropping an `AI_FILL_TYPES` element beside prose inserts the template immediately. `useAiFill` then replaces it with an element built from the paragraph above the drop point, or from paragraphs selected when the drag started.
- **contentEditable pattern:** `EditableText` / `bindContent` write content via callback refs only when the node isn't focused, and commit on blur. Don't render editable text as React children.
- **Inline styles inside article blocks are intentional.** "Copy HTML" exports the article DOM as-is, so that markup must carry its own styles. Everything outside the article (chrome, modals, toolbars) uses co-located CSS files.
- AI calls go straight from the browser to Anthropic, OpenAI, Gemini or Ollama, with the key stored in localStorage (Settings modal). There is no backend.

## Coding style (follow it)

- Plain JS + React 18 + Vite. No TypeScript, PropTypes or JSDoc.
- Function components only, as `function Foo() {}` declarations (not arrow consts). Use named exports; only `App` is `export default`.
- Destructure props in the signature. Name handlers `function handleX(e) {}`; trivial ones can be inline arrows.
- Hooks: one per file, named export `useX`, returning an object or a single value. Always clean up effects.
- Module-level constants are `SCREAMING_SNAKE_CASE` and sit above the component.
- Build className with a template literal plus a BEM modifier, e.g. `` `rail-btn${active ? " rail-btn--active" : ""}` ``. CSS classes are kebab-case.
- Double quotes, semicolons, 2-space indent, and explicit `.jsx`/`.js` in imports.
- Every component gets a co-located `.css` file. Global tokens and fonts live in `src/index.css`.
- Keep comments sparse and only for non-obvious *why*.

## Git

- Remote: `PanotAbhay/aihackathon`. Several teammates push to the same branches, so run `git pull --rebase` before pushing.
- **Never add Claude attribution** (no `Co-Authored-By: Claude`, no "Generated with Claude Code") in commits or PRs.
- Don't commit `dist/`, `node_modules/` or `.claude/settings.local.json`; all three are gitignored.
- `main` has diverged from the feature branch and holds a teammate's `.claude/settings.json` auto-pull hook. Expect overlap when merging.
