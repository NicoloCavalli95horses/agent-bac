// button.js
// These functions are injected in the visited webpage

// ===========
// Functions
// ===========

export async function injectButton() {
  window.__instrumentation__ ??= {};

  if (!window.__instrumentation__.installButton) {
    await installButton();
    installClickListener();
  }
  window.__instrumentation__.installButton = true;
  window.__instrumentation__.setButtonState = setButtonState;
}



function setButtonState(state) {
  const btn = document.getElementById("__playwright_debug");
  if (!btn) { return; }

  btn.dataset.state = state;
  btn.innerText = updateBtnLabel(state);
}



async function installButton() {
  if (document.getElementById("__playwright_debug")) { return; }
  if (typeof window._getState != "function") { return; }

  const btn = document.createElement("button");
  btn.id = "__playwright_debug";

  const state = await window._getState();
  btn.dataset.state = state;
  btn.innerText = updateBtnLabel(state);

  btn.style.cssText = `
    position: fixed;
    top: auto;
    left: auto;
    bottom: 0px;
    right: 0px;
    width: auto;
    z-index: 2147483647;
    background: #000;
    color: white;
    cursor:pointer;
    border: none;
    padding: 2px 4px;
    font-family: monospace;
    font-size: 12px;
    text-trasform: uppercase;
  `;

  btn.onclick = async () => {
    if (typeof window._dispatchEvent === "function") {
      await window._dispatchEvent({ type: "STATE_CHANGE_REQUEST", source: "button" });
    }
  };

  document.body.appendChild(btn);
}



function getClickableTarget(el) {
  return el.closest("button, a, input, select, textarea, [role='button'], [onclick]") || el;
}



function getElFingerprint(el) {
  if (!el) { return null; }

  const attrs = Array.from(el.attributes)
    .filter(attr => attr.name.startsWith("data-") || attr.name === "role" || attr.name === "name")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(attr => ({ name: attr.name, value: attr.value }));

  const rect = el.rect || el.getBoundingClientRect();

  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classes: Array.from(el.classList),
    attributes: attrs,
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    }
  };
}



function installClickListener() {
  document.addEventListener("click", e => {
    const canEmitClick = !e.target.closest("#__playwright_debug") && typeof window._dispatchEvent === "function";
    if (canEmitClick) {
      const target = e.target instanceof Element ? getClickableTarget(e.target) : null;
      if (!target) { return; }

      const position = {
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY,
      }

      window._dispatchEvent({ type: "CLICK", target: getElFingerprint(target), position });
    }
  }, true);
}



function updateBtnLabel(state) {
  switch (state) {
    case "idle":
      return "Click to start";

    case "exploration":
      return "Processing page...";

    case "evaluation":
      return "Evaluating feature...";

    default:
      return "Click to start";
  }
}