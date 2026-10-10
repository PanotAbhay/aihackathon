import {
  FONT_OPTIONS, LETTER_SPACING_STEPS, LINE_HEIGHT_STEPS, SIZE_STEPS, TEXT_LEVELS, presetById,
} from "../data/fontSystems.js";

const byId = (id) => FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];
const step = (steps, id) => steps.find((s) => s.id === id) || steps[1];
const round = (n, places) => Number(n.toFixed(places));
const loaded = new Set();

const googleHref = (f) => `https://fonts.googleapis.com/css2?family=${f.google}:wght@400;500;600;700&display=swap`;

// Google fonts are added once per page; the bundled ones need no request.
function loadFont(id) {
  const f = byId(id);
  if (!f.google || loaded.has(f.google) || typeof document === "undefined") return;
  loaded.add(f.google);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = googleHref(f);
  document.head.appendChild(link);
}

// Turn one level's step choices into concrete values against its preset.
function resolveLevel(base, choice) {
  return {
    size: Math.round(base.size * step(SIZE_STEPS, choice.size).scale),
    lh: round(base.lh + step(LINE_HEIGHT_STEPS, choice.lh).delta, 2),
    ls: round(base.ls + step(LETTER_SPACING_STEPS, choice.ls).delta, 3),
  };
}

// Stylesheets an exported article needs for the Google fonts it uses.
export function fontLinks(fonts) {
  const ids = new Set(TEXT_LEVELS.map((l) => fonts[l.id].font));
  return [...ids].map(byId).filter((f) => f.google).map(googleHref);
}

// Push the chosen typography into CSS variables that the article's text reads.
export function applyFonts(fonts) {
  const preset = presetById(fonts.preset);
  const root = document.documentElement.style;
  for (const { id: level } of TEXT_LEVELS) {
    const choice = fonts[level];
    const v = resolveLevel(preset[level], choice);
    loadFont(choice.font);
    root.setProperty(`--${level}-font`, byId(choice.font).stack);
    root.setProperty(`--${level}-weight`, String(choice.weight));
    root.setProperty(`--${level}-size`, v.size + "px");
    root.setProperty(`--${level}-lh`, String(v.lh));
    root.setProperty(`--${level}-ls`, v.ls + "em");
  }
}
