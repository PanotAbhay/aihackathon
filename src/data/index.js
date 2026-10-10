export const STORAGE_KEYS = {
  doc: "nt-fb-doc",
  docPrev: "nt-fb-doc-prev",
  ai: "nt-fb-ai",
  fonts: "nt-fb-fonts",
  zoom: "nt-fb-zoom",
  recovered: "nt-fb-recovered",
  legacyRecovered: "nt-feature-builder",
  template: "nt-fb-template",
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
  byline: () => ({ type: "byline", a: "Reporter Name", b: "Desk" }),
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
      { type: "byline", label: "Attribution", icon: "badge", hint: "Author name, desk and read time" },
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

// Each template sets the canvas look (CSS variable overrides), the blocks the
// palette offers, extra rules for the AI, and the demo page it starts from.
export const TEMPLATES = {
  news: {
    key: "news",
    label: "News",
    icon: "newspaper",
    description: "Reported stories and features. Drop-cap opening, pull quotes, photos and The Nutshell summary.",
    look: {},
    blocks: ["byline", "body", "h2", "h3", "dropcap", "quote", "bullets", "numbered", "divider", "image", "gallery", "pair", "chart", "line", "poll", "table", "timeline", "stats", "nutshell"],
    aiRules: [
      "ALWAYS one image at after:-1, plus 1–3 more image/pair/gallery at natural breaks.",
      "ALWAYS one nutshell at after:1 or after:2 — four plain-language bullets summarising the whole piece. This is the house signature; never skip it.",
      "quote: only real quoted speech present in the text, verbatim, max 3.",
    ],
    starter: [
      { type: "h1", html: "Dhaka commuters say the roads feel less safe than a year ago" },
      { type: "standfirst", html: "A survey of 200 daily travellers finds most now change their routes to avoid danger — and many pay extra to do it." },
      { type: "byline", a: "Reporter Name", b: "Metro Desk" },
      { type: "image", slots: [""], a: "Evening traffic on a main road in central Dhaka.", b: "PHOTO CREDIT" },
      { type: "dropcap", html: "Open with the most important fact of the story: who, what, where and when, in one or two plain sentences." },
      { type: "body", html: "Follow with the detail that explains why it matters, then the evidence behind it." },
      { type: "nutshell", a: "The Nutshell", html: "<li>First key point.</li><li>Second key point.</li><li>Third key point.</li><li>Fourth key point.</li>" },
      { type: "h2", html: "What the survey found" },
      { type: "body", html: "Use sub-headings every three or four paragraphs to break the story into sections." },
      { type: "stats", a: "By the numbers", b: "Survey, 2026", cells: [{ value: "~200", label: "PEOPLE SURVEYED" }, { value: "86.5%", label: "FELT UNSAFE" }, { value: "63.6%", label: "AVOID ROADS" }, { value: "42.4%", label: "PAY EXTRA" }] },
      { type: "quote", a: "A line from an interviewee worth pulling out of the copy.", b: "— NAME, ROLE" },
      { type: "body", html: "Close with what happens next, or the open question the story leaves." },
      { type: "divider" },
    ],
  },
  finance: {
    key: "finance",
    label: "Finance",
    icon: "trending_up",
    description: "Markets, earnings and the economy. Leads with the numbers — stat rows, trend lines and results tables.",
    look: { "--red": "#1E7A52", "--paper": "#F3F5F1", "--paper-faint": "#ECF0EA", "--rule": "#D5DCD3", "--rule-light": "#E3E8E1" },
    blocks: ["byline", "body", "h2", "h3", "dropcap", "quote", "bullets", "divider", "image", "chart", "line", "table", "timeline", "stats", "nutshell"],
    aiRules: [
      "Lead with the market-moving number: put a stats row at after:1 when the text has 3+ headline figures.",
      "Figures tracked over time → line; comparisons across companies or sectors → chart or table.",
      "Keep every currency symbol, unit and decimal exactly as written. Never round.",
      "ALWAYS one nutshell at after:1 or after:2 titled \"What it means\" — four plain-language bullets for a non-expert reader.",
      "At most one image.",
    ],
    starter: [
      { type: "h1", html: "DSEX climbs for a third week as banks lead the rally" },
      { type: "standfirst", html: "Strong quarterly results from the largest lenders lifted the benchmark index, while textile exporters lagged." },
      { type: "byline", a: "Reporter Name", b: "Business Desk" },
      { type: "stats", a: "This week", b: "DSE, close of trading", cells: [{ value: "5,824", label: "DSEX" }, { value: "+2.1%", label: "WEEKLY CHANGE" }, { value: "Tk 9.4bn", label: "DAILY TURNOVER" }, { value: "110.4", label: "USD/BDT" }] },
      { type: "dropcap", html: "Open with the number that moved and the reason it moved, in plain language." },
      { type: "nutshell", a: "What it means", html: "<li>What happened, in one line.</li><li>Why it happened.</li><li>Who it affects.</li><li>What to watch next.</li>" },
      { type: "h2", html: "How the index moved" },
      { type: "line", a: "DSEX gain since the start of the month", b: "%", bars: [{ label: "WK 1", value: 0.4 }, { label: "WK 2", value: 1.1 }, { label: "WK 3", value: 1.6 }, { label: "WK 4", value: 2.1 }] },
      { type: "body", html: "Explain the trend and what drove each move." },
      { type: "h2", html: "Results by sector" },
      { type: "table", rows: [["SECTOR", "CHANGE", "LEADER"], ["Banks", "+4.8%", "Company A"], ["Pharma", "+1.2%", "Company B"], ["Textiles", "−0.9%", "Company C"]] },
      { type: "body", html: "Close with the outlook and the next data release to watch." },
      { type: "divider" },
    ],
  },
  research: {
    key: "research",
    label: "Research",
    icon: "science",
    description: "Papers and studies explained. Abstract, key findings, method and results with charts and tables.",
    look: { "--red": "#2554E8", "--paper": "#FAFAF8", "--paper-faint": "#F2F3F6", "--rule": "#DCDDE3", "--rule-light": "#E8E9ED" },
    blocks: ["byline", "body", "h2", "h3", "quote", "bullets", "numbered", "divider", "image", "pair", "chart", "line", "table", "timeline", "stats", "nutshell"],
    aiRules: [
      "The standfirst is a one- or two-sentence plain-language abstract of the study.",
      "ALWAYS one nutshell at after:0 or after:1 titled \"Key findings\" — 3–4 bullets.",
      "Use h2 for the paper's own sections (Introduction, Method, Results, Discussion) when the source has them; do not invent sections it lacks.",
      "Results with numbers → chart or table; tables flattened by PDF import must be rebuilt with replaceTo.",
      "quote only for a statement the text attributes to a named researcher. No drop caps.",
    ],
    starter: [
      { type: "h1", html: "Lightweight models can spot crop disease on a basic phone" },
      { type: "standfirst", html: "A plain-language summary of the study: what the researchers asked, how they tested it, and what they found." },
      { type: "byline", a: "Author Names", b: "Institution" },
      { type: "nutshell", a: "Key findings", html: "<li>First finding.</li><li>Second finding.</li><li>Third finding.</li>" },
      { type: "h2", html: "Introduction" },
      { type: "body", html: "Set out the problem and why it matters, citing the gap the study fills." },
      { type: "h2", html: "Method" },
      { type: "numbered", html: "<li>Data collected.</li><li>Models trained.</li><li>How they were evaluated.</li>" },
      { type: "h2", html: "Results" },
      { type: "chart", a: "Accuracy by model", b: "%", bars: [{ label: "MODEL A", value: 94 }, { label: "MODEL B", value: 89 }, { label: "MODEL C", value: 81 }] },
      { type: "table", a: "Evaluated architectures", rows: [["MODEL", "SIZE", "ACCURACY"], ["Model A", "4.2 MB", "94%"], ["Model B", "2.9 MB", "89%"], ["Model C", "1.5 MB", "81%"]] },
      { type: "h2", html: "Discussion" },
      { type: "body", html: "What the results mean, their limits, and what should be studied next." },
      { type: "divider" },
    ],
  },
  lab: {
    key: "lab",
    label: "Lab manual",
    icon: "biotech",
    description: "Step-by-step practicals. Aim, equipment, numbered procedure, safety notes and results tables.",
    look: { "--red": "#C26A12", "--paper": "#F6F6F4", "--paper-faint": "#EEEEEA", "--rule": "#D9D9D3", "--rule-light": "#E6E6E1", "--font-serif": "var(--font-sans)" },
    blocks: ["byline", "body", "h2", "h3", "bullets", "numbered", "divider", "image", "pair", "chart", "line", "table", "stats", "nutshell"],
    aiRules: [
      "Structure as sections with h2: Aim, Safety, Equipment, Procedure, Results, Questions — using only those the source covers.",
      "Equipment and materials → bullets. Procedure → numbered, one action per step, keeping every quantity, temperature and time exactly.",
      "Safety warnings go in ONE nutshell titled \"Safety\" placed before the procedure.",
      "Results to record → table with empty cells for the student; measured relationships → line.",
      "No pull quotes, no drop caps, no timelines.",
    ],
    starter: [
      { type: "h1", html: "Experiment 3: Measuring the rate of a reaction" },
      { type: "standfirst", html: "Aim: find out how temperature changes how fast sodium thiosulfate reacts with hydrochloric acid." },
      { type: "byline", a: "Course name", b: "Lab session" },
      { type: "nutshell", a: "Safety", html: "<li>Wear eye protection at all times.</li><li>Hydrochloric acid is an irritant — wash spills with water.</li><li>Work in a ventilated area.</li>" },
      { type: "h2", html: "Equipment" },
      { type: "bullets", html: "<li>Conical flask, 100 ml</li><li>Measuring cylinders, 10 ml and 50 ml</li><li>Stopwatch</li><li>Water bath</li>" },
      { type: "h2", html: "Procedure" },
      { type: "numbered", html: "<li>Measure 50 ml of sodium thiosulfate into the flask.</li><li>Warm the flask in the water bath to 20 °C.</li><li>Add 5 ml of hydrochloric acid and start the stopwatch.</li><li>Stop timing when the cross beneath the flask disappears.</li><li>Repeat at 30, 40 and 50 °C.</li>" },
      { type: "image", slots: [""], a: "Set-up: flask on a printed cross over the water bath.", b: "PHOTO CREDIT" },
      { type: "h2", html: "Results" },
      { type: "table", rows: [["TEMPERATURE (°C)", "TIME (S)", "RATE (1/S)"], ["20", "", ""], ["30", "", ""], ["40", "", ""], ["50", "", ""]] },
      { type: "line", a: "Expected trend", b: "Rate", bars: [{ label: "20 °C", value: 10 }, { label: "30 °C", value: 18 }, { label: "40 °C", value: 31 }, { label: "50 °C", value: 52 }] },
      { type: "h2", html: "Questions" },
      { type: "numbered", html: "<li>Describe the relationship between temperature and rate.</li><li>Explain it using collision theory.</li><li>Suggest one source of error and how to reduce it.</li>" },
    ],
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);
