// Variables written by the font settings (see utils/fonts.js).
const TYPE_VAR = /^--(h1|h2|h3|standfirst|body)-/;

// Swap font-setting var() references for their current values so the pasted article
// keeps the chosen typography; other variables stay as house tokens.
function bakeTypeVars(css, computed) {
  let out = "";
  let i = 0;
  for (;;) {
    const at = css.indexOf("var(", i);
    if (at < 0) return out + css.slice(i);
    let end = at + 3;
    for (let depth = 0; end < css.length; end++) {
      if (css[end] === "(") depth++;
      else if (css[end] === ")" && --depth === 0) break;
    }
    const inner = css.slice(at + 4, end);
    const name = inner.split(",")[0].trim();
    const value = TYPE_VAR.test(name) ? computed.getPropertyValue(name).trim() : "";
    out += css.slice(i, at) + (value || css.slice(at, end + 1));
    i = end + 1;
  }
}

// Clone the live article and strip everything that only exists for editing.
// `fontLinks` are stylesheet URLs for web fonts the article uses.
export function articleHtml(node, fontLinks = []) {
  const c = node.cloneNode(true);
  const computed = getComputedStyle(document.documentElement);
  c.querySelectorAll("[style]").forEach((n) => n.setAttribute("style", bakeTypeVars(n.getAttribute("style"), computed)));
  c.querySelectorAll("[data-chrome]").forEach((n) => n.remove());
  c.querySelectorAll("[contenteditable]").forEach((n) => {
    n.removeAttribute("contenteditable");
    n.removeAttribute("data-ph");
  });
  c.querySelectorAll("select,button").forEach((n) => n.remove());
  const last = c.lastElementChild;
  if (last && /drag elements here/i.test(last.textContent)) last.remove();
  c.querySelectorAll("[data-rw]").forEach((n) => n.removeAttribute("data-rw"));
  // The indent rule lives in index.css, so bake it onto each paragraph.
  c.querySelectorAll("[data-indent] > p").forEach((p) => {
    p.setAttribute("style", "margin:0;text-indent:" + (p.previousElementSibling ? "1.5em" : "0") + ";");
  });
  c.querySelectorAll(".nt-blk").forEach((n) => {
    n.removeAttribute("class");
    n.removeAttribute("data-sel");
    n.removeAttribute("data-blk");
    n.setAttribute("style", "position:relative;");
  });
  const links = fontLinks.map((href) => '<link rel="stylesheet" href="' + href + '">').join("");
  return links + '<article style="max-width:688px;margin:0 auto;">' + c.innerHTML + "</article>";
}
