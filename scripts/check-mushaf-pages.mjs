import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dir = join(root, "public", "mushaf-pages");
const strict = process.argv.includes("--strict") || process.env.RIFQ_MUSHAF_STRICT === "1";
const expected = 604;
const minBytes = Math.max(10000, Number(process.env.MUSHAF_MIN_BYTES || 10000));

function pad(page) {
  return String(page).padStart(3, "0");
}

function isReady(file) {
  return existsSync(file) && statSync(file).size > minBytes;
}

const missing = [];
for (let page = 1; page <= expected; page += 1) {
  const file = join(dir, `${pad(page)}.png`);
  if (!isReady(file)) missing.push(pad(page));
}

const extraCount = existsSync(dir)
  ? readdirSync(dir).filter((name) => /^\d{3}\.png$/.test(name)).length
  : 0;

if (missing.length) {
  console.error(`Mushaf embedded pages: ${expected - missing.length}/${expected} ready.`);
  console.error(`PNG files found: ${extraCount}/${expected}.`);
  console.error(`Missing or too small: ${missing.slice(0, 16).join(", ")}${missing.length > 16 ? "..." : ""}`);
  console.error("Run: npm run mushaf:download");
  if (strict) process.exit(1);
  process.exitCode = 0;
} else {
  console.log(`Mushaf embedded pages: ${expected}/${expected} ready.`);
}
