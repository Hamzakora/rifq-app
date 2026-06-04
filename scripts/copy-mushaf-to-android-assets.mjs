import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceDir = join(root, "public", "mushaf-pages");
const androidDir = join(root, "android");
const targetDir = join(root, "android", "app", "src", "main", "assets", "public", "mushaf-pages");
const expected = 604;
const minBytes = Math.max(10000, Number(process.env.MUSHAF_MIN_BYTES || 10000));

function countReadyPages(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => {
    if (!/^\d{3}\.png$/.test(name)) return false;
    const file = join(dir, name);
    return statSync(file).size > minBytes;
  }).length;
}

const sourceCount = countReadyPages(sourceDir);

if (sourceCount !== expected) {
  console.error(`Mushaf pages are not ready in public/mushaf-pages: ${sourceCount}/${expected}.`);
  console.error("Run: npm run mushaf:download");
  process.exit(1);
}

if (!existsSync(androidDir)) {
  console.error("Android folder is missing. Run: npm run android:add");
  process.exit(1);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

const targetCount = countReadyPages(targetDir);

if (targetCount !== expected) {
  console.error(`Android mushaf assets are incomplete: ${targetCount}/${expected}.`);
  process.exit(1);
}

console.log(`Mushaf pages copied to Android assets: ${expected}/${expected} ready.`);
