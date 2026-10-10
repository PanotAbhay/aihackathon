# aihackathon
QMUL AI Hackathon
- https://qmul-ai-hackathon.devpost.com/?ref_content=default&ref_feature=challenge&ref_medium=portfolio

## Compose

Visual feature builder for Nutshell Today: import an article, let AI structure it, then edit it on the page — drag elements from the palette, reorder blocks, drop in photos and format text in place. Dropping a data or text element (table, chart, quote, timeline…) beside a paragraph has the AI build it from that paragraph, or from the paragraphs you had selected when you started dragging. `Compose (standalone).html` is the original single-file build; this React app is a port of it with the same look and behaviour.

```
npm install
npm run dev
```

### Exporting

The **Export** menu in the top bar has two options:

- **Download HTML**: saves one `.html` file with the fonts and colours embedded. It opens offline.
- **Export PDF** (A4 layouts only): opens the A4 pages and the print dialog; choose **Save as PDF**.
- **Copy HTML**: copies the article markup to the clipboard.

### Sharing publicly

`npm run share` builds the app and serves it at `http://127.0.0.1:4173`. Put a tunnel in front of it to get a public HTTPS link. The link works only while your machine is awake and both commands are running.

With ngrok (free account):

1. `winget install ngrok.ngrok`, then sign up at dashboard.ngrok.com and run `ngrok config add-authtoken <token>`.
2. Terminal 1: `npm run share`. Terminal 2: `ngrok http 127.0.0.1:4173`. Your free dev domain is under **Domains** in the dashboard; pass it with `--url <name>.ngrok-free.app` if the agent doesn't pick it up.

On the free plan, visitors click through an ngrok warning page once, and monthly bandwidth and request caps apply.

Other tunnels:

- **Cloudflare Quick Tunnel**: `cloudflared tunnel --url http://127.0.0.1:4173`. No account and no warning page. The `*.trycloudflare.com` URL changes on every run.
- **VS Code port forwarding**: in the Ports panel, forward 4173 and set visibility to Public. Needs a GitHub or Microsoft sign-in.
- **Tailscale Funnel**: `tailscale funnel 4173`. Stable `*.ts.net` URL; needs a Tailscale account.
- **localtunnel / Pinggy**: `npx localtunnel --port 4173` or `ssh -p 443 -R0:127.0.0.1:4173 a.pinggy.io`. Nothing to install, but less reliable.

The app has no backend, so a static host keeps it online without your machine:

- **Netlify Drop**: `npm run build`, then drag `dist/` onto app.netlify.com/drop.
- **Vercel, Netlify or Cloudflare Pages**: import this repo with build command `npm run build` and output directory `dist`.
- **GitHub Pages**: also set `base: "/aihackathon/"` in `vite.config.js` and `basename={import.meta.env.BASE_URL}` on `BrowserRouter` in `main.jsx`.

A tunnel host has to be listed in `server.allowedHosts` in `vite.config.js`, or Vite answers "Blocked request". Visitors enter their own AI key in Settings. The Ollama provider calls Ollama on the visitor's own machine, which needs `OLLAMA_ORIGINS` set to the public URL.

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

The LaTeX paper template adds an **Export .tex** button to the top bar. It converts the article into a compilable `article`-class document: sections, abstract, booktabs tables and pgfplots charts. If the article has photos, you get a `.zip` with `main.tex` and a `figures/` folder (each photo cropped as framed on the page), ready to upload to Overleaf. Figures, tables and charts keep the editor's size, placement and placeholder text, so the compiled PDF matches the page. The converter is `src/utils/latexExport.js`.

The Lab manual template also handles book-length manuals. It adds **Code listing** (numbered lines, SQL and Python colouring; click to edit the plain text) and the **Structure** group: **Chapter** and **Appendix** (numbered 1, 2… and A, B…, each starting a new A4 page) and **Contents** (built from the chapters and headings, with page numbers in print layouts). Long listings and contents split across pages at a line break. Select text and press **Inline code** in the format bar to set it in the monospace font (`\texttt` in the .tex export).

PDF import reads structure from the fonts as well as the text. Typewriter-font runs become code listings (LaTeX listings' line numbers and spacing are cleaned up), larger type becomes chapters and headings ("Chapter 2" over a title becomes a chapter), a Contents page becomes a contents block, figures are cut out of the pages as pictures with their "Figure 2.1:" captions, and bold lead-ins and inline typewriter text keep their styling. The imported text marks this as `# Chapter 2: …`, `##`/`###` headings, ``` fences, `[[image N]]` and `[[toc]]`, which Import as plain text and Format with AI both convert directly (`paraBlocks` in `src/utils/blocks.js`). Templates without those blocks get ordinary headings and paragraphs instead. Pictures stay with the import until the next file is loaded; they are not autosaved with the recovered text.

To add a template, add an entry to `TEMPLATES`; the picker, menu and prompts pick it up automatically.

### Tests

`npm test` runs the Vitest suite, with every test file in its own worker thread (`npm run test:watch` re-runs on save). It covers pagination, block transforms, import (including a PDF built in the test), the LaTeX export, chart labels, every block type in every template, the canvas and the app's first launch.

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
- [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`), by Mozilla, PDF import (Apache 2.0)

`.docx` import uses only browser built-ins (`DecompressionStream`). PDF import uses PDF.js, loaded only when a PDF is imported, so pages come out in order with their fonts' characters (ligatures included) and figures are never read as text. HTML export uses only browser built-ins.

### AI services

The app calls the model the user picks in Settings, with the user's own key. No SDK is bundled; requests are plain `fetch` calls in `src/utils/ai.js`.

- [Anthropic Claude API](https://docs.anthropic.com) — default `claude-sonnet-4-5`; also reads scanned PDFs
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev) — also reads scanned PDFs
- [Ollama](https://ollama.com), running locally — default model Meta [Llama 3.1](https://www.llama.com)

### Fonts

Bundled in `src/assets/fonts/`:

- [Baskervville](https://fonts.google.com/specimen/Baskervville), by ANRT, headlines and titles (SIL OFL 1.1)
- [Satoshi](https://www.fontshare.com/fonts/satoshi), by Indian Type Foundry via Fontshare, interface text (Fontshare Free License)
- [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono), by Christian Robertson, labels and data (Apache 2.0)
- [Computer Modern (CMU)](https://www.checkmyworking.com/cm-web-fonts/), by Donald Knuth, LaTeX paper template (SIL OFL 1.1), via the `computer-modern` npm package
- [Material Symbols Outlined](https://fonts.google.com/icons), by Google, icons (Apache 2.0)

Loaded from [Google Fonts](https://fonts.google.com) only when picked in the Fonts panel (all SIL OFL 1.1):

- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display), by Claus Eggers Sørensen
- [Lora](https://fonts.google.com/specimen/Lora), by Cyreal
- [Merriweather](https://fonts.google.com/specimen/Merriweather), by Sorkin Type
- [Inter](https://fonts.google.com/specimen/Inter), by Rasmus Andersson
- [DM Sans](https://fonts.google.com/specimen/DM+Sans), by Colophon Foundry
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), by Florian Karsten

### Sample content

`sample/Lab Manual.pdf` is a sample document for testing article import.
