// Demo notice with the "Get in touch" action button, shown on every demo page under themes/.
// Each page includes it once, right before </body>:  <script src="../overlay.js"></script>
// The notice's HTML, CSS and behaviour live in this file; the button itself is The Action Button of the
// main site, defined only in css/action-button.css, which this file loads (the notice stays hidden until
// that file has loaded). Class names start with "dkd-demo" and the styles reset theme CSS (all: initial) and
// use two-class selectors, so it looks the same in every theme; font properties are !important because
// some themes force theirs on p, a and div with !important.
// Wide screens: a card in the bottom right corner. Phones: a low bar along the bottom edge.
// Nothing is added before the page's load event, so the notice's fonts and button CSS never compete
// with the theme's own fonts and hero image (LCP).
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || document.querySelector(".dkd-demo")) {
    return;
  }

  // paths relative to this file (themes/overlay.js), so they also work on a local server
  var siteRoot = new URL("../", script.src);
  var fontUrl = new URL("fonts/JetBrainsMono-Regular.woff2", siteRoot).href;
  var fontBoldUrl = new URL("fonts/JetBrainsMono-Bold.woff2", siteRoot).href;
  var buttonCssUrl = new URL("css/action-button.css", siteRoot).href;
  var ctaUrl = new URL("#contact", siteRoot).href;
  var storageKey = "dkd_demo_closed";

  try {
    if (sessionStorage.getItem(storageKey) === "1") {
      return;
    }
  } catch (e) {
    // storage blocked: just show the notice
  }

  var mono = "font-family:'DK Demo Mono',ui-monospace,Menlo,Consolas,monospace!important;";
  var css =
    "@font-face{font-family:'DK Demo Mono';src:url('" + fontUrl + "') format('woff2');font-weight:400;font-display:swap}" +
    "@font-face{font-family:'DK Demo Mono';src:url('" + fontBoldUrl + "') format('woff2');font-weight:700;font-display:swap}" +
    ".dkd-demo,.dkd-demo *{all:initial;box-sizing:border-box}" +
    "aside.dkd-demo{position:fixed;right:20px;bottom:20px;z-index:9999;display:grid;width:340px;" +
      "grid-template-columns:1fr auto;grid-template-areas:'title close' 'text text' 'cta cta';" +
      "align-items:center;column-gap:10px;padding:16px 18px 20px;border:2px solid #0d1321;" +
      "border-radius:20px;background:#ffffff;box-shadow:0 1rem 3rem rgba(0,0,0,.175);" + mono + "-webkit-font-smoothing:antialiased}" +
    "aside.dkd-demo-loading{visibility:hidden}" +
    "aside.dkd-demo:not(.dkd-demo-loading){animation:dkd-demo-in .5s .3s cubic-bezier(.2,.7,.2,1) both}" +
    "@keyframes dkd-demo-in{from{opacity:0;transform:translateY(18px)}}" +
    ".dkd-demo .dkd-demo-title{grid-area:title;display:block;margin:2px 0 8px;color:#0d1321;" + mono +
      "font-size:17px!important;font-weight:700!important;line-height:1.35!important}" +
    ".dkd-demo .dkd-demo-text{grid-area:text;display:block;margin:0 0 16px;color:#4a5068;" + mono +
      "font-size:13px!important;font-weight:400!important;line-height:1.55!important}" +
    ".dkd-demo .dkd-demo-text strong{color:#171230;" + mono + "font-size:13px!important;font-weight:400!important}" +
    ".dkd-demo .action-btn{grid-area:cta;justify-self:start}" +
    ".dkd-demo .dkd-demo-close{grid-area:close;align-self:start;display:flex;align-items:center;justify-content:center;width:32px;height:32px;" +
      "margin:-4px -6px -4px 0;border-radius:50%;color:#4a5068;" + mono + "font-size:22px!important;line-height:1!important;" +
      "cursor:pointer;transition:background-color .2s ease,color .2s ease}" +
    ".dkd-demo .dkd-demo-close:hover{background:#fff1e2;color:#0d1321}" +
    ".dkd-demo .dkd-demo-close:focus-visible{outline:2px solid #ff911c;outline-offset:2px}" +
    "@media (max-width:700px){" +
      "aside.dkd-demo{left:12px;right:12px;bottom:12px;width:auto;padding:12px 14px 14px;border-radius:14px;" +
        "grid-template-columns:1fr auto;grid-template-areas:'title title' 'text cta';column-gap:12px;row-gap:10px}" +
      ".dkd-demo .dkd-demo-close{position:absolute;top:6px;right:6px;margin:0}" +
      ".dkd-demo .dkd-demo-title{margin:0;padding-right:28px;font-size:14px!important}" +
      ".dkd-demo .dkd-demo-text{margin:0;font-size:11.5px!important;line-height:1.45!important}" +
      ".dkd-demo .dkd-demo-text strong{display:none}" +
      ".dkd-demo .action-btn{justify-self:end}" +
    "}" +
    "@media (prefers-reduced-motion:reduce){aside.dkd-demo:not(.dkd-demo-loading){animation:none}}";

  var style = document.createElement("style");
  style.textContent = css;

  var buttonCss = document.createElement("link");
  buttonCss.rel = "stylesheet";
  buttonCss.href = buttonCssUrl;

  var box = document.createElement("aside");
  box.className = "dkd-demo dkd-demo-loading";
  box.setAttribute("aria-label", "Demo notice");

  var close = document.createElement("button");
  close.type = "button";
  close.className = "dkd-demo-close";
  close.setAttribute("aria-label", "Close the demo notice");
  close.textContent = "×";

  var title = document.createElement("p");
  title.className = "dkd-demo-title";
  title.textContent = "A demo to explore";

  var text = document.createElement("p");
  text.className = "dkd-demo-text";
  text.appendChild(document.createTextNode("A fictional business with working pages, made to show what is possible."));
  var by = document.createElement("strong");
  by.textContent = " Design and code: Drago Katić Development.";
  text.appendChild(by);

  var cta = document.createElement("a");
  cta.className = "action-btn";
  cta.href = ctaUrl;
  cta.textContent = "Get in touch";

  close.addEventListener("click", function () {
    box.remove();
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch (e) {
      // not remembered, the notice comes back on the next page
    }
  });

  [title, close, text, cta].forEach(function (el) {
    box.appendChild(el);
  });

  function show() {
    box.classList.remove("dkd-demo-loading");
  }
  buttonCss.addEventListener("load", show);
  buttonCss.addEventListener("error", show);

  function mount() {
    document.head.appendChild(style);
    document.head.appendChild(buttonCss);
    document.body.appendChild(box);
  }
  if (document.readyState === "complete") {
    mount();
  } else {
    window.addEventListener("load", mount, { once: true });
  }
})();
