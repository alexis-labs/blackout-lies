import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, renameSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const powershellCommand = process.platform === "win32" ? "powershell.exe" : "pwsh";
const outDir = join(root, "out");
const releaseDir = join(root, "release");
const zipPath = join(releaseDir, "blackout-lies-itchio.zip");
const nextDir = join(outDir, "_next");
const itchNextDir = join(outDir, "next");

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".svg",
  ".txt",
]);

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      ...options.env,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  });
}

function walk(directory, visitor) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(path, visitor);
      continue;
    }

    if (entry.isFile()) {
      visitor(path);
    }
  }
}

function rewriteNextAssetPaths() {
  walk(outDir, (filePath) => {
    if (!textExtensions.has(extname(filePath))) {
      return;
    }

    const original = readFileSync(filePath, "utf8");
    const updated = original.replaceAll("/_next/", "/next/");

    if (updated !== original) {
      writeFileSync(filePath, updated);
    }
  });
}

function removeIfExists(path) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

run(npmCommand, ["run", "build"], {
  env: {
    ITCH_STATIC_EXPORT: "1",
  },
});

removeIfExists(itchNextDir);

if (existsSync(nextDir)) {
  renameSync(nextDir, itchNextDir);
}

rewriteNextAssetPaths();

mkdirSync(releaseDir, { recursive: true });
removeIfExists(zipPath);

run(powershellCommand, [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -CompressionLevel Optimal`,
]);

const zipSizeMb = (statSync(zipPath).size / 1024 / 1024).toFixed(1);
console.log(`itch.io package ready: ${zipPath} (${zipSizeMb} MB)`);
