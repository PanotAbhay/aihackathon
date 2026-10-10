// Clone the live article and strip everything that only exists for editing.
export function articleHtml(node) {
  const c = node.cloneNode(true);
  c.querySelectorAll("[data-chrome]").forEach((n) => n.remove());
  c.querySelectorAll("[contenteditable]").forEach((n) => {
    n.removeAttribute("contenteditable");
    n.removeAttribute("data-ph");
  });
  c.querySelectorAll("select,button").forEach((n) => n.remove());
  const last = c.lastElementChild;
  if (last && /drag elements here/i.test(last.textContent)) last.remove();
  c.querySelectorAll("[data-rw]").forEach((n) => n.removeAttribute("data-rw"));
  c.querySelectorAll(".nt-blk").forEach((n) => {
    n.removeAttribute("class");
    n.removeAttribute("data-sel");
    n.removeAttribute("data-blk");
    n.setAttribute("style", "position:relative;");
  });
  return '<article style="max-width:688px;margin:0 auto;">' + c.innerHTML + "</article>";
}
