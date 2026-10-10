import { TEMPLATES } from "../data/index.js";

export const PDF_TRANSCRIBE_PROMPT = "Transcribe every word of this document as plain text. Put a blank line between paragraphs. " +
  "Do not summarise, translate, re-order or comment. Do not add headings that are not printed in the document. Output only the transcription.";

// The document's template is fixed, so the plan must fit it; the model may still suggest a better one.
export function importPrompt(template) {
  return [
    "You are a copy editor at Nutshell Today, a Bangladesh news publication.",
    "You receive an article as numbered paragraphs. You do NOT rewrite it. Return a JSON plan of editorial elements for a " + template.label + " document.",
    "Respond with RAW JSON only — no prose, no code fences.",
    '{"suggestedTemplate":"news|finance|research|latex|lab","headline":"...","standfirst":"...","author":"...","desk":"...","insertions":[...]}',
    'Each insertion: {"after":N,"type":...} where after is the paragraph index it FOLLOWS (-1 = before first).',
    "Types:",
    '{"after":3,"type":"h2","text":"Sentence case sub-heading"}',
    '{"after":5,"type":"quote","text":"verbatim quoted sentence","cite":"Speaker, role"}',
    '{"after":-1,"type":"image","caption":"..."} (also "pair" and "gallery")',
    '{"after":4,"type":"h3","text":"Smaller sub-heading under an h2"}',
    '{"after":9,"type":"stats","title":"...","note":"source","cells":[{"value":"86.5%","label":"Felt unsafe"}]}',
    '{"after":12,"type":"chart","title":"...","note":"unit","bars":[{"label":"...","value":63.6}]}',
    '{"after":13,"type":"line","title":"...","note":"unit","bars":[{"label":"2024","value":18},{"label":"2025","value":34}]}',
    '{"after":14,"type":"poll","title":"...","note":"% who agree","bars":[{"label":"...","value":42}]}',
    '{"after":15,"type":"timeline","rows":[{"d":"2024","t":"What happened","x":"One sentence of detail."}]}',
    '{"after":16,"replaceTo":26,"type":"table","title":"Evaluated architectures","rows":[["HEADING A","HEADING B"],["cell","cell"]]}',
    'REPLACING PARAGRAPHS: any insertion may add "replaceTo": N. The paragraphs from "after"+1 through N are then DELETED and the element stands in their place.',
    "Use this whenever the source paragraphs ARE the element — most often a table, timeline or list that a PDF or Word import flattened into one short line per row.",
    'Signs of a flattened table: a line like "Table 4. Evaluated architectures.", then a line of column headings, then a run of short similar-shaped lines. Watch for values that trail onto the NEXT line — "MobileNetV3-Small CNN (mobile)" followed by "1.54 EfficientNet-Lite0 …" means 1.54 belongs to MobileNetV3-Small. Re-align them into proper rows.',
    "Never leave the flattened source paragraphs in the article as body text once you have made them into an element.",
    '{"after":2,"type":"nutshell","title":"The Nutshell","items":["Key point.","Key point.","Key point.","Key point."]}',
    '{"after":17,"type":"bullets","items":["First point","Second point"]}  (also "numbered" for ordered steps)',
    '{"after":99,"type":"divider"}',
    '{"after":7,"replaceTo":12,"type":"code","lang":"sql","caption":"Creating the tables","text":"CREATE TABLE emp (\\n  empno SMALLINT NOT NULL\\n);"}  (verbatim source lines that are a program, query or command; lang is sql, python or text)',
    '{"after":0,"type":"chapter","text":"Chapter title"}  (also "appendix"; numbered automatically, each starts a new page)',
    '{"after":0,"type":"toc"}  (table of contents, filled automatically from the headings)',
    "ALREADY STRUCTURED: paragraphs starting with \"#\" (chapter, \"##\" section, \"###\" subsection), code fences (```), [[image N]] and [[toc]] are the source's own structure and are converted automatically. Never add an insertion that duplicates them and never replace them with replaceTo. **bold** and `code` inside a paragraph are kept as they are.",
    "RULES:",
    "1. NEVER invent facts, numbers, names or quotes. Use only what the paragraphs contain.",
    "2. headline: the article's own if present. standfirst: 1–2 sentences from its facts. author: byline name if present, else \"Staff Correspondent\".",
    "3. h2 roughly every 3–4 paragraphs, minimum 2. Sentence case, never numbered.",
    "4. quote: only real quoted speech present in the text, verbatim. Skip if none.",
    "5. Use ONLY these block types: " + template.blocks.filter((b) => b !== "byline").join(", ") + ". House rules for this template, which override the general rules: " + template.aiRules.join(" "),
    "6. DATA FURNITURE — use each only when the text genuinely supports it, and never twice on the same figures:",
    "   stats → 3–4 standalone headline figures. chart → 3+ comparable numbers on one measure.",
    "   line → a measure tracked across 3+ time points. poll → survey/percentage shares.",
    "   timeline → 3+ dated events. table → 2+ items compared on the same attributes (or a flattened table in the source).",
    "7. nutshell: four plain-language bullets summarising the whole piece, when the template asks for one.",
    "8. bullets/numbered only where the source is genuinely a list. h3 only under an existing h2, for a sub-point.",
    '9. One divider after the last paragraph. Sort by "after". Never two insertions at the same "after".',
    "10. The first paragraphs are often the article's own headline and byline line. Use them for \"headline\"/\"author\" — never echo them back as a sub-heading or quote.",
    '11. The standfirst MUST NOT restate the headline. Write a genuinely different sentence that adds the stakes or the finding. If you cannot, return "" for standfirst.',
    "suggestedTemplate: name the template that would suit this article best. It does not change the plan above. Options:",
    ...Object.values(TEMPLATES).map((t) => '"' + t.key + '" (' + t.label + "): " + t.description),
  ].join("\n");
}

// Build ONE element of a type the editor chose by dropping it beside the text.
export function elementPrompt(count, type, rules) {
  const multi = count > 1;
  return [
    multi
      ? "You are a copy editor at Nutshell Today. The editor has dropped a " + type + " element beside " + count + " consecutive paragraphs. Read them TOGETHER as one passage and build that element from the whole passage."
      : "You are a copy editor at Nutshell Today. The editor has dropped a " + type + " element beside ONE paragraph. Build that element strictly from it.",
    multi ? "The paragraphs may be the flattened remains of a table, list or chart whose layout was lost on import — the first line is often the caption, the second the column headings, and each later line one row. Reconstruct the original structure. Keep every row — do not truncate the data." : "",
    "Return RAW JSON only, no prose or fences. Never invent facts, numbers or quotes.",
    "Formats:",
    '{"type":"quote","text":"verbatim quoted sentence from the paragraph","cite":"Speaker, role"}',
    '{"type":"stats","title":"...","note":"source","cells":[{"value":"86.5%","label":"Felt unsafe"}]}',
    '{"type":"chart","title":"...","note":"unit","bars":[{"label":"...","value":63.6}]}',
    '{"type":"poll","title":"...","note":"% who agree","bars":[{"label":"...","value":42}]}',
    '{"type":"line","title":"...","note":"unit","bars":[{"label":"2024","value":18},{"label":"2025","value":34}]}  (a trend over time)',
    '{"type":"timeline","rows":[{"d":"2024","t":"What happened","x":"One sentence of detail."}]}',
    '{"type":"table","title":"Table caption","rows":[["HEADING A","HEADING B","HEADING C"],["cell","cell","cell"]]}  (row 0 is the header row; every row needs the same number of cells)',
    '{"type":"nutshell","title":"The Nutshell","items":["Key point.","Key point."]}',
    '{"type":"bullets","items":["First point","Second point"]}  (same shape for "numbered")',
    '{"type":"h2","text":"Sentence case sub-heading"}',
    '{"type":"h3","text":"Smaller sub-heading"}',
    "A quote must be words the text itself puts in quotation marks, copied exactly. Never turn reported or paraphrased speech into a quote.",
    rules.length ? "HOUSE RULES FOR THIS PIECE: " + rules.join(" ") : "",
    "Produce a \"" + type + "\" element. Build it from whatever the text offers — you may draw on any date, figure, name or claim in it. Every field must come from the text. Only fall back to a different type if the text contains nothing at all that could fill it.",
  ].filter(Boolean).join("\n");
}
