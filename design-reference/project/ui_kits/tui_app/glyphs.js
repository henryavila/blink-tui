// glyphs.js — canonical glyph constants for the blink kit.
// Mirrors assets/glyphs.json. Exposed on window for Babel cross-file scope.

const STATE = {
  check:       "✓",
  cross:       "✗",
  circle:      "◯",
  half:        "◐",
  checkboxOn:  "☑",
  checkboxOff: "☐",
  warn:        "⚠",
  rerun:       "↻",
};

const NAV = {
  focus:     "▶",
  collapsed: "▸",
  expanded:  "▾",
  depends:   "↳",
  flow:      "→",
  back:      "◀",
};

const BOX = {
  tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│",
  teeL: "├", teeR: "┤", teeT: "┬", teeB: "┴", cross: "┼",
  rtl: "╭", rtr: "╮", rbl: "╰", rbr: "╯",
  dtl: "╔", dtr: "╗", dbl: "╚", dbr: "╝", dh: "═", dv: "║",
};

// Nerd Font private-use domain glyphs (literal chars).
const DOMAIN = {
  database:   "\uf1c0",
  mysql:      "\ue704",
  postgresql: "\ue76e",
  redis:      "\ue76d",
  docker:     "\uf308",
  github:     "\uf09b",
  git:        "\ue702",
  ssh:        "\uf015",
  nodejs:     "\ue718",
  php:        "\ue73d",
  python:     "\ue73c",
  vim:        "\ue7c5",
  apple:      "\uf179",
  linux:      "\uf17c",
  ubuntu:     "\uf31b",
  font:       "\uf031",
  ai:         "\uf2db",
  bolt:       "\uf0e7",
};

const SPINNER = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

Object.assign(window, { STATE, NAV, BOX, DOMAIN, SPINNER });
