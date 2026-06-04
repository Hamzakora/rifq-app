import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dir = join(root, "android", "app", "src", "main", "assets", "public", "mushaf-pages");
const expected = 604;
const minBytes = Math.max(10000, Number(process.env.MUSHAF_MIN_BYTES || 10000));

function countReadyPages(targetDir) {
  if (!existsSync(targetDir)) return 0;
  return readdirSync(targetDir).filter((name) => {
    if (!/^\d{3}\.png$/.test(name)) return false;
    return statSync(join(targetDir, name)).size > minBytes;
  }).length;
}

const count = countReadyPages(dir);

if (count !== expected) {
  console.error(`Android assets mushaf pages: ${count}/${expected}.`);
  console.error("Run: npm run android:copy-mushaf");
  process.exit(1);
}

console.log(`Android assets mushaf pages: ${expected}/${expected} ready.`);
