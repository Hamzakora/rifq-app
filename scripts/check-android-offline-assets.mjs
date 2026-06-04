import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dir = join(root, "android", "app", "src", "main", "assets", "public", "offline-data");

const files = [
  { name: "quran-pages.json", minBytes: 50000 },
  { name: "tafsir-muyassar.json", minBytes: 500000 },
  { name: "hadith-library.json", minBytes: 500000 }
];

let failed = false;

for (const file of files) {
  const target = join(dir, file.name);
  if (!existsSync(target)) {
    console.error(`Android offline data missing: ${file.name}`);
    failed = true;
    continue;
  }

  const size = statSync(target).size;
  if (size < file.minBytes) {
    console.error(`Android offline data is too small: ${file.name} (${size} bytes)`);
    failed = true;
    continue;
  }

  console.log(`Android offline data ready: ${file.name} (${size} bytes)`);
}

if (failed) {
  console.error("Run: npm run android:prepare");
  process.exit(1);
}

console.log("Android offline data is ready.");
