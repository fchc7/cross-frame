import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    plugins: "src/plugins/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  outDir: "dist",
  target: "es2017",
  bundle: true,
  external: [],
});
