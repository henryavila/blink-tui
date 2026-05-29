// theme.js — THE THEME OWNER.  (load before any component / app script)
//
// In a blink app the colour scheme is a property of the TERMINAL SURFACE, not
// of any component — exactly like a real terminal emulator's theme. This module
// is the SINGLE place that scheme is controlled. It:
//
//   • applies the active theme by setting ONE attribute, `data-theme`, on the
//     root surface (document.documentElement = the terminal window);
//   • persists the choice (localStorage) so a reload keeps it;
//   • exposes a tiny API for a theme picker to drive it and for UIs to re-render.
//
// HARD RULE (see the contract header in colors_and_type.css):
//   No COMPONENT may call setTheme, read getTheme, or branch on data-theme.
//   Components own no colour — they read intent tokens (--accent, --state-ok…)
//   and recolour automatically when this module flips the attribute. Theme is
//   never per component; it is one switch on the surface, owned here.
//
// A scoped theme boundary (data-theme on a subtree) is the only sanctioned
// exception and is set in markup, not through this module.

(function () {
  var STORAGE_KEY = "blink-theme";
  var DEFAULT = "tokyonight";

  // The registry of themes. Adding a palette = add a [data-theme] block in
  // colors_and_type.css and one row here. `blurb`/`mode` are for the picker UI.
  var THEMES = [
    { id: "neutral",    label: "neutral",     mode: "dark",  blurb: "Catppuccin Mocha · calm default" },
    { id: "contrast",   label: "neutral+",    mode: "dark",  blurb: "neutral · more contrast" },
    { id: "vivid",      label: "vivid",       mode: "dark",  blurb: "accent on selection & featured" },
    { id: "nord",       label: "nord",        mode: "dark",  blurb: "frost & polar night · cool" },
    { id: "gruvbox",    label: "gruvbox",     mode: "dark",  blurb: "retro · warm & earthy" },
    { id: "tokyonight", label: "tokyo night", mode: "dark",  blurb: "saturated indigo night" },
    { id: "latte",      label: "latte",       mode: "light", blurb: "Catppuccin Latte · light" },
  ];
  var IDS = THEMES.map(function (t) { return t.id; });

  var listeners = [];
  var current = DEFAULT;

  function isValid(id) { return IDS.indexOf(id) !== -1; }

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeStored(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
  }

  // applyTheme — the ONE mutation. Sets the attribute on the root surface; CSS
  // inheritance repaints the whole tree. No component is touched or notified
  // about colour directly — they just resolve new --ctp-* values.
  function applyTheme(id) {
    if (!isValid(id)) id = DEFAULT;
    current = id;
    document.documentElement.setAttribute("data-theme", id);
  }

  function getTheme() { return current; }
  function getThemeMeta(id) {
    id = id || current;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return THEMES[0];
  }

  // notify — fire subscribers (theme switched, or the theme list changed).
  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](current); } catch (e) {}
    }
  }

  // setTheme — the public switch a picker calls. Applies, persists, notifies.
  function setTheme(id) {
    if (!isValid(id)) return;
    applyTheme(id);
    writeStored(id);
    notify();
  }

  // onTheme(fn) — subscribe to switches (e.g. a React re-render hook so live
  // specimens recompute getComputedStyle). Returns an unsubscribe function.
  function onTheme(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i !== -1) listeners.splice(i, 1);
    };
  }

  // ── registerTheme ── a consumer creates a theme from its OWN code, no framework
  //    edits, mirroring registerGlyphs(). The new theme is injected as a
  //    [data-theme] rule and appears in the picker immediately.
  //
  //    BlinkTheme.registerTheme({
  //      id: 'dracula', label: 'dracula', mode: 'dark', blurb: '…',
  //      extends: 'neutral',                 // base palette to inherit (default 'neutral')
  //      palette: { base:'#282a36', lavender:'#bd93f9', … },  // override any of the 26 slots
  //      intent:  { 'state-pending':'var(--ctp-sky)' },        // optional intent overrides
  //      select:  true,                       // optional — switch to it now
  //    });
  //
  //    Only the slots you supply need listing — the rest are inherited from
  //    `extends`, so a few accent overrides is a complete, valid theme.
  var SLOTS = [
    "crust", "mantle", "base", "surface0", "surface1", "surface2",
    "overlay0", "overlay1", "overlay2", "subtext0", "subtext1", "text",
    "rosewater", "flamingo", "pink", "mauve", "red", "maroon", "peach",
    "yellow", "green", "teal", "sky", "sapphire", "blue", "lavender",
  ];
  var styleEl = null;
  function ensureStyleEl() {
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "blink-theme-registered";
      document.head.appendChild(styleEl);
    }
    return styleEl;
  }
  // Read a base theme's resolved 26-slot palette off a hidden probe, so a
  // registered theme can inherit everything it doesn't override — without the
  // base palettes being duplicated into JS.
  function readPalette(baseId) {
    var probe = document.createElement("div");
    probe.setAttribute("data-theme", isValid(baseId) ? baseId : DEFAULT);
    probe.style.display = "none";
    document.documentElement.appendChild(probe);
    var cs = getComputedStyle(probe);
    var pal = {};
    for (var i = 0; i < SLOTS.length; i++) {
      pal[SLOTS[i]] = cs.getPropertyValue("--ctp-" + SLOTS[i]).trim();
    }
    probe.parentNode.removeChild(probe);
    return pal;
  }
  function registerTheme(def) {
    if (!def || !def.id) return null;
    var id = def.id;
    var pal = readPalette(def.extends);              // inherit base, then merge
    if (def.palette) for (var k in def.palette) pal[k] = def.palette[k];
    var decls = "";
    for (var i = 0; i < SLOTS.length; i++) decls += "  --ctp-" + SLOTS[i] + ": " + pal[SLOTS[i]] + ";\n";
    var rule = '[data-theme="' + id + '"] {\n' + decls + "}\n";
    if (def.intent) {
      var io = "";
      for (var key in def.intent) io += "  --" + key.replace(/^--/, "") + ": " + def.intent[key] + ";\n";
      rule += '[data-theme="' + id + '"] {\n' + io + "}\n";
    }
    ensureStyleEl().appendChild(document.createTextNode(rule));
    var meta = { id: id, label: def.label || id, mode: def.mode || "dark", blurb: def.blurb || "" };
    var found = -1;
    for (var j = 0; j < THEMES.length; j++) if (THEMES[j].id === id) found = j;
    if (found >= 0) THEMES[found] = meta; else THEMES.push(meta);
    IDS = THEMES.map(function (t) { return t.id; });
    if (def.select) setTheme(id); else notify();   // refresh any open picker
    return meta;
  }

  // Boot: adopt a stored choice (the inline head snippet may have already set
  // the attribute to avoid a flash — we just reconcile state with it here).
  var stored = readStored();
  var attr = document.documentElement.getAttribute("data-theme");
  current = isValid(stored) ? stored : (isValid(attr) ? attr : DEFAULT);
  applyTheme(current);

  window.BlinkTheme = {
    THEMES: THEMES,
    getTheme: getTheme,
    getThemeMeta: getThemeMeta,
    setTheme: setTheme,
    onTheme: onTheme,
    registerTheme: registerTheme,
  };
})();
