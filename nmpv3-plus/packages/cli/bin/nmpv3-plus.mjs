#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addNMPv3PlusPackagesToConfig,
  buildNMPv3PlusDeployPackage,
  resolveNMPv3PlusBuildPlan,
  serializeNMPv3PlusBuildManifest,
} from "../../../dist/packages/cli/src/index.js";

const packageRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const args = process.argv.slice(2);
const command = args[0] ?? "plan";

if (command !== "plan" && command !== "build" && command !== "add") {
  console.error(
    "Usage: nmpv3-plus <plan|build> [config.json]\n       nmpv3-plus add [config.json] <extension-or-skin...>",
  );
  process.exit(1);
}

if (command === "add") {
  const maybeConfigPath = args[1] ?? "";
  const hasExplicitConfig = maybeConfigPath.endsWith(".json");
  const addConfigPath = resolve(
    hasExplicitConfig ? maybeConfigPath : "nmpv3-plus.config.json",
  );
  const packageNames = hasExplicitConfig ? args.slice(2) : args.slice(1);

  if (packageNames.length === 0) {
    console.error("Usage: nmpv3-plus add [config.json] <extension-or-skin...>");
    process.exit(1);
  }

  const result = addNMPv3PlusPackagesToConfig(
    await readJsonIfExists(addConfigPath),
    packageNames,
  );

  await mkdir(dirname(addConfigPath), { recursive: true });
  await writeFile(addConfigPath, `${JSON.stringify(result.config, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.stderr.write(`NMPv3+ updated ${addConfigPath}.\n`);
  process.exit(0);
}

const configPath = args[1] ? resolve(args[1]) : "";
const config = configPath ? JSON.parse(await readFile(configPath, "utf8")) : {};

if (command === "build") {
  const result = await buildNMPv3PlusDeployPackage(config, {
    async readText(path) {
      return readFile(resolveInputPath(path), "utf8");
    },
    async writeText(path, contents) {
      const outputPath = resolve(path);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, contents);
    },
    async listFiles(path) {
      const files = [];
      await walk(resolveInputPath(path), path, files);
      return files.map((file) => file.replace(/\\/g, "/"));
    },
  });

  process.stdout.write(result.manifest);
  process.stderr.write(`NMPv3+ wrote ${result.written.length} deploy files.\n`);
  process.exit(0);
}

const plan = resolveNMPv3PlusBuildPlan(config);
const manifest = serializeNMPv3PlusBuildManifest(plan);

await mkdir(dirname(plan.manifestPath), { recursive: true });
await writeFile(plan.manifestPath, manifest);
process.stdout.write(manifest);

async function walk(directory, logicalDirectory, files) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    const logicalPath = join(logicalDirectory, entry.name);

    if (entry.isDirectory()) {
      await walk(path, logicalPath, files);
    } else {
      files.push(logicalPath);
    }
  }
}

function resolveInputPath(path) {
  if (
    path.startsWith("dist/") ||
    path.startsWith("skins/") ||
    path.startsWith("extensions/official/") ||
    path.startsWith("packages/")
  ) {
    return resolve(packageRoot, path);
  }

  return resolve(path);
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}
