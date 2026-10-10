// Small syntax colouring for code listings: keywords, strings and comments, in the colours LaTeX
// listings are usually set in.
export const CODE_COLORS = { keyword: "#1A4FC4", string: "#9400D1", comment: "#008000" };

export const CODE_LANGS = [
  { value: "sql", label: "SQL" },
  { value: "python", label: "Python" },
  { value: "text", label: "Plain text" },
];

const SQL_KEYWORDS = new Set((
  "add all alter and any as asc auto_increment begin between by cascade case check column commit constraint create cross " +
  "database default delete desc distinct drop else end except exists foreign from full function grant group having if in " +
  "index inner insert intersect into is join key left like limit minus not null on or order outer primary procedure " +
  "references rename replace revoke right rollback select set show table then to trigger truncate union unique update use " +
  "using values view when where with"
).split(" "));

const PYTHON_KEYWORDS = new Set((
  "and as assert async await break class continue def del elif else except False finally for from global if import in is " +
  "lambda None nonlocal not or pass raise return True try while with yield"
).split(" "));

const RULES = {
  sql: {
    token: /(\/\*[\s\S]*?(?:\*\/|$))|(--[^\n]*|#[^\n]*)|('(?:[^'\\\n]|\\.|'')*'?|"(?:[^"\\\n]|\\.)*"?|`[^`\n]*`?)|([A-Za-z_][A-Za-z0-9_]*)/g,
    keyword: (w) => SQL_KEYWORDS.has(w.toLowerCase()),
  },
  python: {
    token: /(\b\B)|(#[^\n]*)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|'(?:[^'\\\n]|\\.)*'?|"(?:[^"\\\n]|\\.)*"?)|([A-Za-z_][A-Za-z0-9_]*)/g,
    keyword: (w) => PYTHON_KEYWORDS.has(w),
  },
};

// The text as lines of { text, color } runs; colour is null for plain text.
export function highlightLines(text, lang) {
  const source = String(text == null ? "" : text);
  const rule = RULES[lang];
  const runs = [];
  if (!rule) {
    runs.push({ text: source, color: null });
  } else {
    let at = 0;
    for (const m of source.matchAll(rule.token)) {
      if (m.index > at) runs.push({ text: source.slice(at, m.index), color: null });
      let color = null;
      if (m[1] || m[2]) color = CODE_COLORS.comment;
      else if (m[3]) color = m[3][0] === "`" ? null : CODE_COLORS.string;
      else if (m[4] && rule.keyword(m[4])) color = CODE_COLORS.keyword;
      runs.push({ text: m[0], color });
      at = m.index + m[0].length;
    }
    if (at < source.length) runs.push({ text: source.slice(at), color: null });
  }

  // Split runs at line breaks (block comments and strings may span several lines).
  const lines = [[]];
  runs.forEach((r) => {
    r.text.split("\n").forEach((part, k) => {
      if (k > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, color: r.color });
    });
  });
  return lines;
}

// A guess at the language of an imported listing.
export function guessLang(text) {
  if (/\b(select|insert\s+into|create\s+(table|view|database|index)|drop\s+table|alter\s+table|update\s+\w+\s+set|delete\s+from)\b/i.test(text)) return "sql";
  if (/^\s*(def |import |from \S+ import |class \w+[:(])|print\(/m.test(text)) return "python";
  return "text";
}
