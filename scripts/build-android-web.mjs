import { renameSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "out");
const nextDir = join(root, ".next");
const apiDir = join(root, "app", "api");
const disabledApiDir = join(root, ".rifq-android-build-api-disabled");

function restoreApiDir() {
  if (!existsSync(apiDir) && existsSync(disabledApiDir)) {
    renameSync(disabledApiDir, apiDir);
  }
}

function run(command, args, env = {}) {
  const printable = [command, ...args].join(" ");
  console.log(`\n[rifq-android] Running: ${printable}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...env
    }
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

console.log("[rifq-android] Preparing static Android web build...");

if (existsSync(disabledApiDir)) {
  restoreApiDir();
  if (existsSync(disabledApiDir)) rmSync(disabledApiDir, { recursive: true, force: true });
}

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
if (existsSync(nextDir)) rmSync(nextDir, { recursive: true, force: true });

try {
  if (existsSync(apiDir)) {
    console.log("[rifq-android] Temporarily disabling app/api for static export...");
    renameSync(apiDir, disabledApiDir);
  }

  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  run(command, ["next", "build"], { RIFQ_ANDROID_EXPORT: "1" });
} finally {
  restoreApiDir();
}

if (!existsSync(outDir)) {
  console.error("[rifq-android] Android static export failed: out folder was not created.");
  process.exit(1);
}

console.log("[rifq-android] Android static export is ready in: out");
