import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
  // react / ink are peer deps — never bundle them.
  external: ['react', 'react/jsx-runtime', 'ink'],
});
