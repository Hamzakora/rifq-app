import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const androidDir = join(root, "android");
const outDir = join(root, "out");
const indexFile = join(outDir, "index.html");

function run(command, args) {
  const printable = [command, ...args].join(" ");
  console.log(`\n[rifq-android] Running: ${printable}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) {
    console.error(`[rifq-android] Failed to start command: ${printable}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[rifq-android] Command failed with exit code ${result.status}: ${printable}`);
    process.exit(result.status || 1);
  }
}

if (existsSync(androidDir)) {
  console.log("[rifq-android] Android platform already exists.");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
if (!existsSync(indexFile)) {
  writeFileSync(
    indexFile,
    "<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><title>Rifq</title></head><body>Rifq Android preparation</body></html>\n",
    "utf8"
  );
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
run(command, ["cap", "add", "android"]);
console.log("[rifq-android] Android platform has been added.");
