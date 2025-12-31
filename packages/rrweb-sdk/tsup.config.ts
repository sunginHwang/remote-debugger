import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  external: ["rrweb", "@rrweb/types", "react", "react-dom"],
  platform: "browser",
  target: "es2020",
  esbuildOptions(options) {
    options.banner = {
      js: "/* rrweb-sdk - Auto-recording SDK for rrweb */",
    };
  },
});
