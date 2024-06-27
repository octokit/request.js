import esbuild from "esbuild";
import { sep } from "node:path";
import { copyFile, readFile, writeFile, rm, readdir } from "node:fs/promises";

const sharedOptions = {
  sourcemap: "external",
  sourcesContent: true,
  minify: false,
  allowOverwrite: true,
  packages: "external",
};

async function listFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = dirent.name;
    return dirent.isDirectory() ? listFiles(dir + sep + res) : dirent.path + sep + res;
  }
  ));

  return Array.prototype.concat(...files);
}


async function main() {
  // Start with a clean slate
  await rm("pkg", { recursive: true, force: true });
  // Build the source code for a neutral platform as ESM
  await esbuild.build({
    entryPoints: (await listFiles("src")).filter((file) => file.endsWith(".ts")),
    outdir: "pkg/dist-src",
    bundle: false,
    platform: "neutral",
    format: "esm",
    ...sharedOptions,
    sourcemap: false,
  });

  const entryPoints = ["./pkg/dist-src/index.js"];

  await esbuild.build({
    entryPoints,
    outdir: "pkg/dist-bundle",
    bundle: true,
    platform: "neutral",
    format: "esm",
    ...sharedOptions,
  });

  // Copy the README, LICENSE to the pkg folder
  await copyFile("LICENSE", "pkg/LICENSE");
  await copyFile("README.md", "pkg/README.md");

  // Handle the package.json
  let pkg = JSON.parse((await readFile("package.json", "utf8")).toString());
  // Remove unnecessary fields from the package.json
  delete pkg.scripts;
  delete pkg.prettier;
  delete pkg.release;
  delete pkg.jest;
  await writeFile(
    "pkg/package.json",
    JSON.stringify(
      {
        ...pkg,
        files: ["dist-*/**", "bin/**"],
        types: "dist-types/index.d.ts",
        exports: {
          ".": {
            types: "./dist-types/index.d.ts",
            import: "./dist-bundle/index.js",
            default: "./dist-bundle/index.js",
          },
        },
        sideEffects: false,
      },
      null,
      2
    )
  );
}
main();
