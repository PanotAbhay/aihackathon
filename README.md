# aihackathon
QMUL AI Hackathon
- https://qmul-ai-hackathon.devpost.com/?ref_content=default&ref_feature=challenge&ref_medium=portfolio

## Compose

Visual feature builder for Nutshell Today: import an article, let AI structure it, then edit it on the page — drag elements from the palette, reorder blocks, drop in photos and format text in place. Dropping a data or text element (table, chart, quote, timeline…) beside a paragraph has the AI build it from that paragraph, or from the paragraphs you had selected when you started dragging. `Compose (standalone).html` is the original single-file build; this React app is a port of it with the same look and behaviour.

```
npm install
npm run dev
```

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

### Adding a block type

1. Add a factory to `NEW_BLOCK` and an entry to `PALETTE_GROUPS` in `src/data/index.js`.
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
- [Material Symbols Outlined](https://fonts.google.com/icons), by Google, icons (Apache 2.0)

### Sample content

`sample/Lab Manual.pdf` is a sample document for testing article import.
