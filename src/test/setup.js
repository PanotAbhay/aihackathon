import { afterEach } from "vitest";

// Browser stubs for the jsdom environment (a few tests run in plain Node). jsdom has no layout
// engine and no execCommand; components only need these to exist.
if (typeof window !== "undefined") {
  if (!document.execCommand) document.execCommand = () => true;
  if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  if (!window.ResizeObserver) window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
  // jsdom has no innerText (EditableText reads and writes it); textContent is close enough here.
  if (!("innerText" in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, "innerText", {
      get() { return this.textContent; },
      set(v) { this.textContent = v; },
      configurable: true,
    });
  }

  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });
}
