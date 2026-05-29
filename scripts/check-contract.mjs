#!/usr/bin/env node
// check-contract.mjs — guards the blink visual contract at the source level.
// Fails (exit 1) if a component reaches for a DOM/CSS escape hatch or hardcodes
// a colour. Run via `npm run lint:contract`.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

// Files allowed to contain raw hex colours (the palette is defined here).
const HEX_ALLOWED = new Set(['src/theme/palette.ts']);

const RULES = [
  { re: /className\s*=/, msg: 'className — not a thing in Ink; use <Box>/<Text> props' },
  { re: /<div[\s/>]/, msg: '<div> — use <Box>' },
  { re: /<span[\s/>]/, msg: '<span> — use <Text>' },
  { re: /\bon(Click|MouseEnter|MouseOver|MouseLeave)\b/, msg: 'mouse handler — blink is keyboard-only (useInput)' },
  { re: /position:\s*['"]absolute/, msg: 'absolute positioning — flexbox only' },
  { re: /\bzIndex\b/, msg: 'zIndex — no stacking contexts in a TUI' },
  { re: /\b(transition|animation|transform|boxShadow|backdropFilter)\s*:/, msg: 'CSS motion/shadow — forbidden (only the cursor blinks)' },
];

const HEX = /#[0-9a-fA-F]{6}\b/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

let violations = 0;
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // strip line comments so prose in JSDoc doesn't trip the rules
    const code = line.replace(/\/\/.*/, '');
    for (const rule of RULES) {
      if (rule.re.test(code)) {
        console.error(`✗ ${rel}:${i + 1}  ${rule.msg}`);
        violations++;
      }
    }
    if (!HEX_ALLOWED.has(rel) && HEX.test(code)) {
      console.error(`✗ ${rel}:${i + 1}  raw hex colour — use a semantic token (tokens.*)`);
      violations++;
    }
  });
}

if (violations > 0) {
  console.error(`\n${violations} contract violation(s).`);
  process.exit(1);
}
console.log('✓ contract clean');
