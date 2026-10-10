# aihackathon
QMUL AI Hackathon
- https://qmul-ai-hackathon.devpost.com/?ref_content=default&ref_feature=challenge&ref_medium=portfolio

## Compose

Visual feature builder for Nutshell Today: import an article, let AI structure it, then edit it on the page — drag elements from the palette, reorder blocks, drop in photos and format text in place. Dropping a data or text element (table, chart, quote, timeline…) beside a paragraph has the AI build it from that paragraph, or from the paragraphs you had selected when you started dragging. `Compose (standalone).html` is the original single-file build; this React app is a port of it with the same look and behaviour.

```
npm install
npm run dev
```

### Layout

```
main.jsx                      entry; BrowserRouter + App
src/
├── App.jsx                   routes
├── index.css                 fonts, design tokens, editor globals
├── data/index.js             block factories, palette, presets, AI models
├── hooks/                    one concern per hook (document + undo, drag, AI fill, import, …)
├── utils/                    framework-free logic (AI providers, prompts, docx/pdf readers, block transforms)
└── pages/Compose/
    ├── ComposePage.jsx       owns page state, wires hooks to components
    └── components/           top bar, rail, palette, canvas, modals
        └── blocks/           one component per article block type
```

### Templates

### Documents and tabs

Work happens in **tabs**, and each tab is a separate document with its own template, content, font settings and undo history. **+** in the tab bar (or the rail's template button) opens the template picker; picking a template opens a new tab with that template's starter page. Each document has a **layout**, switched from the top bar: **Web** (one continuous page) or **Print A4** with one or two columns. Print layouts show real A4 sheets: paragraphs split across columns and pages at line breaks (at least two lines either side), headings stay with what follows, and figures, tables and charts that don't fit float to the top of the next column, as in LaTeX. **Preview** opens the rendered document in a new browser tab (A4 sheets for print layouts, ready to print), and Copy HTML exports the same pages. A document's template is **fixed** once chosen. To try the same content in another template, open another tab with that template. All tabs autosave to `localStorage` (`nt-fb-workspace`); a document saved by the earlier single-page version opens as the first tab.

The picker offers **News**, **Finance**, **Research**, **LaTeX paper** and **Lab manual**. Each template, defined in `TEMPLATES` in `src/data/index.js`, sets:

- **look**: CSS variable overrides applied to the canvas (accent colour, paper, rules, headline font)
- **theme**: layout and per-element style overrides (column width, headline alignment, body font, attribution variant, quote, key-facts box, table and divider styles), merged into the blocks' inline styles so Copy HTML exports them
- **blocks**: the element types the palette offers and the AI may use
- **aiRules**: extra instructions for import and drag-to-fill
- **starter**: the demo page you get when you pick it

Each template also has its own **font preset** (`TEMPLATE_FONT_PRESETS` in `src/data/fontSystems.js`). A new tab's font settings start from it, and Settings → Fonts adjusts that tab only. Themes control layout and colour but never hard-code type, so the font settings always take effect.

AI import formats into the tab's template. If the model thinks another template fits better, the confirmation message says so.

The LaTeX paper template adds an **Export .tex** button to the top bar. It converts the article into a compilable `article`-class document: sections, abstract, booktabs tables and pgfplots charts. If the article has photos, you get a `.zip` with `main.tex` and a `figures/` folder, ready to upload to Overleaf. The converter is `src/utils/latexExport.js`.

To add a template, add an entry to `TEMPLATES`; the picker, menu and prompts pick it up automatically.

### Adding a block type

1. Add a factory to `NEW_BLOCK`, an entry to `PALETTE_GROUPS`, and the type to the `blocks` list of each template that should offer it, all in `src/data/index.js`.
2. Create `src/pages/Compose/components/blocks/<Name>Block.jsx` taking `{ block, onPatch }`.
3. Register it in `BLOCK_BODIES` in `BlockFrame.jsx`.
4. If the AI should build it from text on drop, add it to `AI_FILL_TYPES`, handle it in `elementToBlock` (`src/utils/blocks.js`) and describe its JSON in `elementPrompt` (`src/utils/prompts.js`).

Article blocks use inline styles on purpose: "Copy HTML" exports the article DOM as-is, so the markup must carry its own styling. Everything else uses co-located CSS files.

The document, AI settings and zoom persist in `localStorage` (keys in `STORAGE_KEYS`, same names as the standalone file).

## Credits

### Libraries

- [React](https://react.dev) and React DOM (MIT)
- [React Router](https://reactrouter.com) (MIT)
- [Vite](https://vitejs.dev) and [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) (MIT)

`.docx` and PDF import use only browser built-ins (`DecompressionStream`); no parsing library is bundled.

### Fonts

Bundled in `src/assets/fonts/`:

- [Baskervville](https://fonts.google.com/specimen/Baskervville), by ANRT, headlines and titles (SIL OFL 1.1)
- [Satoshi](https://www.fontshare.com/fonts/satoshi), by Indian Type Foundry via Fontshare, interface text (Fontshare Free License)
- [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono), by Christian Robertson, labels and data (Apache 2.0)
- [Computer Modern (CMU)](https://www.checkmyworking.com/cm-web-fonts/), by Donald Knuth, LaTeX paper template (SIL OFL 1.1), via the `computer-modern` npm package
- [Material Symbols Outlined](https://fonts.google.com/icons), by Google, icons (Apache 2.0)

### Sample content

`sample/Lab Manual.pdf` is a sample document for testing article import.
