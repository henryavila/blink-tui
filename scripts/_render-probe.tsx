/* Temp probe: render the svcd example to plain text at a fixed size, capture
   multiple UI states, and report per-line visible widths to expose misalignment.
   Run: npx tsx scripts/_render-probe.tsx [unicode|nerd|ascii] [cols] [rows] */
import React from 'react';
import { render } from 'ink';
import { EventEmitter } from 'node:events';
import { ThemeProvider } from '../src/index.js';
import { App } from '../examples/svcd.js';

const iconSet = (process.argv[2] as 'unicode' | 'nerd' | 'ascii') ?? 'unicode';
const COLS = Number(process.argv[3] ?? 100);
const ROWS = Number(process.argv[4] ?? 30);

class FakeStdout extends EventEmitter {
  columns = COLS;
  rows = ROWS;
  isTTY = true;
  frames: string[] = [];
  write = (s: string) => {
    this.frames.push(s);
    return true;
  };
}
class FakeStdin extends EventEmitter {
  isTTY = true;
  setRawMode() {}
  setEncoding() {}
  resume() {}
  pause() {}
  ref() {}
  unref() {}
  read() {
    return null;
  }
}

const stdout = new FakeStdout();
const stdin = new FakeStdin();

// strip ANSI; return plain visual grid
const strip = (s: string) => s.replace(/\[[0-9;]*m/g, '').replace(/\[[0-9;]*[A-Za-z]/g, '');
// visible width counting wide chars (CJK/box/some glyphs) as best-effort
const vwidth = (line: string) => {
  let w = 0;
  for (const ch of line) {
    const c = ch.codePointAt(0)!;
    if (c === 0) continue;
    // rough wide ranges
    if ((c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xff60) || (c >= 0x1f300 && c <= 0x1faff)) w += 2;
    else w += 1;
  }
  return w;
};

function lastFrame(): string {
  return stdout.frames.length ? stdout.frames[stdout.frames.length - 1]! : '';
}

function dump(label: string) {
  const raw = lastFrame();
  const text = strip(raw);
  const lines = text.split('\n');
  console.log(`\n\n========== ${label} (${iconSet}, ${COLS}x${ROWS}) ==========`);
  lines.forEach((ln, i) => {
    console.log(String(i).padStart(2, ' ') + '|' + ln + '|  w=' + vwidth(ln));
  });
}

const instance = render(
  <ThemeProvider iconSet={iconSet}>
    <App />
  </ThemeProvider>,
  { stdout: stdout as never, stdin: stdin as never, debug: true, exitOnCtrlC: false, patchConsole: false },
);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

await wait(120);
dump('DEFAULT (two panes)');

stdin.emit('data', '?');
await wait(80);
dump('HELP dialog');

stdin.emit('data', '?'); // close help
await wait(40);
stdin.emit('data', 'd'); // delete dialog
await wait(80);
dump('DELETE dialog');

stdin.emit('data', 'n'); // close
await wait(40);
stdin.emit('data', '/'); // search
await wait(40);
stdin.emit('data', 'r');
stdin.emit('data', 'e');
await wait(80);
dump('SEARCH field active');

instance.unmount();
await wait(20);
process.exit(0);
