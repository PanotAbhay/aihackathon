import {
  FONT_OPTIONS, LETTER_SPACING_STEPS, LINE_HEIGHT_STEPS, SIZE_STEPS, TEXT_LEVELS, presetById,
} from "../data/fontSystems.js";

// Saved settings from an older shape (raw numbers per level) are discarded for the template's own.
export function validFonts(saved) {
  return !!saved && !!saved.preset && TEXT_LEVELS.every((l) => saved[l.id] && SIZE_STEPS.some((s) => s.id === saved[l.id].size));
}

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
    // Two decimals: exact point sizes (10pt = 13.33px) must not round to a different size.
    size: round(base.size * step(SIZE_STEPS, choice.size).scale, 2),
    lh: round(base.lh + step(LINE_HEIGHT_STEPS, choice.lh).delta, 2),
    ls: round(base.ls + step(LETTER_SPACING_STEPS, choice.ls).delta, 3),
  };
}

// Stylesheets an exported article needs for the Google fonts it uses.
export function fontLinks(fonts) {
  const ids = new Set(TEXT_LEVELS.map((l) => fonts[l.id].font));
  return [...ids].map(byId).filter((f) => f.google).map(googleHref);
}

// The chosen typography as CSS variables, applied to a tab's canvas so each tab keeps its own.
export function fontVars(fonts) {
  const preset = presetById(fonts.preset);
  const vars = {};
  for (const { id: level } of TEXT_LEVELS) {
    const choice = fonts[level];
    const v = resolveLevel(preset[level], choice);
    loadFont(choice.font);
    vars[`--${level}-font`] = byId(choice.font).stack;
    vars[`--${level}-weight`] = String(choice.weight);
    vars[`--${level}-size`] = v.size + "px";
    vars[`--${level}-lh`] = String(v.lh);
    vars[`--${level}-ls`] = v.ls + "em";
  }
  return vars;
}
