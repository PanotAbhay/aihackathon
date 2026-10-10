export const STORAGE_KEYS = {
  doc: "nt-fb-doc",
  docPrev: "nt-fb-doc-prev",
  ai: "nt-fb-ai",
  zoom: "nt-fb-zoom",
  recovered: "nt-fb-recovered",
  legacyRecovered: "nt-feature-builder",
};

export const TEXTISH_TYPES = ["h1", "standfirst", "h2", "h3", "body", "dropcap", "bullets", "numbered"];
export const PROSE_TYPES = ["body", "dropcap"];
export const IMAGE_TYPES = ["image", "pair", "gallery"];
export const HEADING_TYPES = ["h2", "h3"];
// Dropped beside a paragraph, these are built by the AI from that text.
export const AI_FILL_TYPES = ["h2", "h3", "quote", "bullets", "numbered", "stats", "chart", "line", "poll", "table", "timeline", "nutshell"];

export const NEW_BLOCK = {
  h2: () => ({ type: "h2", html: "Sub-heading" }),
  h3: () => ({ type: "h3", html: "Smaller sub-heading" }),
  body: () => ({ type: "body", html: "New paragraph." }),
  dropcap: () => ({ type: "dropcap", html: "Opening paragraph of the feature." }),
  bullets: () => ({ type: "bullets", html: "<li>First point</li><li>Second point</li>" }),
  numbered: () => ({ type: "numbered", html: "<li>First step</li><li>Second step</li>" }),
  quote: () => ({ type: "quote", a: "A line worth pulling out of the copy.", b: "— NAME, ROLE" }),
  image: () => ({ type: "image", slots: [""], a: "Caption for this photograph.", b: "PHOTO CREDIT" }),
  pair: () => ({ type: "pair", slots: ["", ""], a: "Caption describing both photographs.", b: "PHOTO CREDIT" }),
  gallery: () => ({ type: "gallery", slots: ["", "", ""], a: "Caption for the gallery.", b: "PHOTO CREDIT" }),
  stats: () => ({
    type: "stats",
    a: "By the numbers",
    b: "Source",
    cells: [
      { value: "~200", label: "PEOPLE SURVEYED" },
      { value: "86.5%", label: "FELT UNSAFE" },
      { value: "63.6%", label: "AVOID ROADS" },
      { value: "42.4%", label: "PAY EXTRA" },
    ],
  }),
  chart: () => ({
    type: "chart",
    a: "Chart title",
    b: "Unit",
    bars: [
      { label: "FIRST", value: 64 },
      { label: "SECOND", value: 50 },
      { label: "THIRD", value: 42 },
    ],
  }),
  line: () => ({
    type: "line",
    a: "Trend title",
    b: "Unit",
    bars: [
      { label: "2023", value: 18 },
      { label: "2024", value: 34 },
      { label: "2025", value: 52 },
      { label: "2026", value: 71 },
    ],
  }),
  poll: () => ({
    type: "poll",
    a: "Poll title",
    b: "% who agree",
    bars: [
      { label: "FIRST", value: 62 },
      { label: "SECOND", value: 45 },
      { label: "THIRD", value: 28 },
    ],
  }),
  table: () => ({
    type: "table",
    rows: [
      ["MEASURE", "WHAT IT FIXES", "ALSO HELPS"],
      ["First measure", "The problem", "Who else gains"],
      ["Second measure", "The problem", "Who else gains"],
    ],
  }),
  timeline: () => ({
    type: "timeline",
    rows: [
      { d: "2024", t: "First milestone", x: "What happened and why it mattered." },
      { d: "2025", t: "Second milestone", x: "What happened and why it mattered." },
      { d: "2026 · NEXT", t: "What comes next", x: "The open question." },
    ],
  }),
  nutshell: () => ({ type: "nutshell", a: "The Nutshell", html: "<li>First key point.</li><li>Second key point.</li><li>Third key point.</li>" }),
  divider: () => ({ type: "divider" }),
};

export const PALETTE_GROUPS = [
  {
    key: "g-text",
    label: "TEXT",
    items: [
      { type: "body", label: "Paragraph", icon: "subject", hint: "Body paragraph" },
      { type: "h2", label: "Sub-heading", icon: "format_h2", hint: "Section sub-heading" },
      { type: "h3", label: "Small sub-head", icon: "format_h3", hint: "Smaller sub-heading" },
      { type: "dropcap", label: "Opening para", icon: "text_fields", hint: "Paragraph with a drop cap" },
      { type: "quote", label: "Pull quote", icon: "format_quote", hint: "Pull quote with attribution" },
      { type: "bullets", label: "Bullet list", icon: "format_list_bulleted", hint: "Bulleted list" },
      { type: "numbered", label: "Numbered list", icon: "format_list_numbered", hint: "Numbered list" },
      { type: "divider", label: "Divider", icon: "horizontal_rule", hint: "Section divider" },
    ],
  },
  {
    key: "g-media",
    label: "MEDIA",
    items: [
      { type: "image", label: "Image", icon: "image", hint: "One photograph" },
      { type: "gallery", label: "Gallery", icon: "collections", hint: "Three-up gallery" },
      { type: "pair", label: "Image pair", icon: "splitscreen_right", hint: "Two photographs side by side" },
    ],
  },
  {
    key: "g-data",
    label: "DATA",
    items: [
      { type: "chart", label: "Bar chart", icon: "bar_chart", hint: "Vertical bar chart" },
      { type: "line", label: "Line chart", icon: "show_chart", hint: "Smooth curve showing a trend over time" },
      { type: "poll", label: "Poll bars", icon: "percent", hint: "Horizontal percentage bars" },
      { type: "table", label: "Table", icon: "table_chart", hint: "Rule-based table" },
      { type: "timeline", label: "Timeline", icon: "timeline", hint: "Dated timeline" },
      { type: "stats", label: "Stat row", icon: "tag", hint: "Row of big numbers" },
      { type: "nutshell", label: "Key facts", icon: "checklist", hint: "The Nutshell summary box" },
    ],
  },
];

export const TEXT_TYPE_OPTIONS = [
  { value: "h1", label: "Headline" },
  { value: "standfirst", label: "Standfirst" },
  { value: "h2", label: "Sub-heading" },
  { value: "h3", label: "Small sub-head" },
  { value: "dropcap", label: "Opening (drop cap)" },
  { value: "body", label: "Body" },
  { value: "bullets", label: "Bullet list" },
  { value: "numbered", label: "Numbered list" },
];

export const AI_MODELS = {
  builtin: "claude-sonnet-4-5",
  anthropic: "claude-sonnet-4-5",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  ollama: "llama3.1",
};

export const AI_PROVIDERS = [
  { value: "builtin", label: "Built-in (inside the design tool)" },
  { value: "anthropic", label: "Anthropic — Claude" },
  { value: "openai", label: "OpenAI — GPT" },
  { value: "gemini", label: "Google — Gemini" },
  { value: "ollama", label: "Ollama (runs on this machine)" },
];
