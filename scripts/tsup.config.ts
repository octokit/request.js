// @ts-check

import type { Options } from "tsup";

import { defineConfig } from "tsup";
import { copyFile, readFile, writeFile, rm, mkdir } from "node:fs/promises";

const DIST = "./pkg";

export default defineConfig(async () => {
  // Start with a clean slate
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST);

  const sharedOptions: Options = {
    sourcemap: true,
    minify: false,
    clean: true,
    dts: false,
    keepNames: true,
    splitting: false,
    treeshake: false,
  };

  // Build the source code for a neutral platform as ESM
  const esmNeutral: Options = {
    ...sharedOptions,
    entry: ["src"],
    outDir: `${DIST}/dist-src`,
    platform: "neutral",
    target: "es2020",
    format: "esm",
    sourcemap: false,
  };

  const node: Options = {
    ...sharedOptions,
    entry: ["src/index.ts"],
    outDir: `${DIST}/dist-node`,
    bundle: true,
    platform: "node",
    target: "node18",
    format: ["cjs", "esm"],
  };

  const web: Options = {
    ...sharedOptions,
    entry: ["src/index.ts"],
    outDir: `${DIST}/dist-web`,
    bundle: true,
    platform: "browser",
    target: "es2020",
    format: ["cjs", "esm"],
  };

  // Copy the README, LICENSE to the pkg folder
  await copyFile("LICENSE", `${DIST}/LICENSE`);
  await copyFile("README.md", `${DIST}/README.md`);

  // Handle the package.json
  let pkg = JSON.parse((await readFile("package.json", "utf8")).toString());
  // Remove unnecessary fields from the package.json
  delete pkg.scripts;
  delete pkg.prettier;
  delete pkg.release;
  delete pkg.jest;
  await writeFile(
    `${DIST}/package.json`,
    JSON.stringify(
      {
        ...pkg,
        files: ["dist-*/**", "bin/**"],
        main: "dist-node/index.js",
        browser: "dist-web/index.js",
        types: "dist-types/index.d.ts",
        module: "dist-src/index.mjs",
        sideEffects: false,
        exports: {
          types: "./dist-types/index.d.ts",
          browser: {
            import: "./dist-web/index.mjs",
            require: "./dist-web/index.js",
          },
          node: {
            import: "./dist-node/index.mjs",
            require: "./dist-node/index.js",
          },
          default: "./dist-src/index.mjs",
        },
      },
      null,
      2,
    ),
  );

  return [esmNeutral, node, web];
});
