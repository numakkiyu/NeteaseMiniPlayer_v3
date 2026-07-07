import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const assets = [
  {
    from: "nmpv3/dist/nmpv3.min.js",
    to: "docs/public/demo/assets/nmpv3.min.js",
  },
];

for (const asset of assets) {
  const source = resolve(asset.from);
  const target = resolve(asset.to);

  try {
    await stat(source);
  } catch {
    process.stderr.write(
      `Docs demo asset skipped: ${asset.from} was not found. Build @netease-mini-player/v3 to enable the local demo bundle.\n`,
    );
    continue;
  }

  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  process.stderr.write(`Docs demo asset copied: ${asset.to}\n`);
}
