import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const targetDir = join(root, "public", "mushaf-pages");
const primaryBaseUrl = process.env.MUSHAF_PAGES_BASE_URL || "https://raw.githubusercontent.com/GovarJabbar/Quran-PNG/master";
const baseUrls = Array.from(new Set([
  primaryBaseUrl,
  "https://raw.githubusercontent.com/GovarJabbar/Quran-PNG/master"
].filter(Boolean)));
const ext = process.env.MUSHAF_PAGES_EXT || "png";
const start = Number(process.env.MUSHAF_START_PAGE || 1);
const end = Number(process.env.MUSHAF_END_PAGE || 604);
const concurrency = Math.max(1, Math.min(8, Number(process.env.MUSHAF_CONCURRENCY || 4)));
const minBytes = Math.max(10000, Number(process.env.MUSHAF_MIN_BYTES || 10000));

mkdirSync(targetDir, { recursive: true });

function pad(page) {
  return String(page).padStart(3, "0");
}

function fileIsReady(filePath) {
  return existsSync(filePath) && statSync(filePath).size > minBytes;
}

async function fetchWithTimeout(url, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { "user-agent": "rifq-mushaf-downloader/1.0" } });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadFrom(url, filePath) {
  const res = await fetchWithTimeout(url);
  if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`);
  await pipeline(res.body, createWriteStream(filePath));
  if (!fileIsReady(filePath)) {
    try { unlinkSync(filePath); } catch {}
    throw new Error("downloaded file is too small");
  }
}

async function downloadPage(page) {
  const name = `${pad(page)}.${ext}`;
  const filePath = join(targetDir, name);
  if (fileIsReady(filePath)) return { page, skipped: true };

  const errors = [];
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl.replace(/\/$/, "")}/${name}`;
    try {
      await downloadFrom(url, filePath);
      return { page, skipped: false };
    } catch (error) {
      errors.push(`${url} => ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Failed page ${name}: ${errors.join(" | ")}`);
}

const pages = [];
for (let page = start; page <= end; page += 1) pages.push(page);
let done = 0;
let failed = 0;
const failedPages = [];

async function worker(items) {
  while (items.length) {
    const page = items.shift();
    try {
      const result = await downloadPage(page);
      done += 1;
      const label = result.skipped ? "exists" : "saved";
      process.stdout.write(`\r${label} ${pad(page)}.${ext} — ${done}/${pages.length}`);
    } catch (error) {
      failed += 1;
      failedPages.push(page);
      console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const queue = [...pages];
await Promise.all(Array.from({ length: concurrency }, () => worker(queue)));
process.stdout.write("\n");

const readyCount = pages.filter((page) => fileIsReady(join(targetDir, `${pad(page)}.${ext}`))).length;

if (failed || readyCount !== pages.length) {
  throw new Error(`Mushaf pages are incomplete: ${readyCount}/${pages.length}. Failed pages: ${failedPages.join(", ") || "unknown"}`);
}

console.log(`Mushaf pages are ready in public/mushaf-pages (${readyCount} checked).`);
