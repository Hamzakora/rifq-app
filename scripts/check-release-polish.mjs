import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "public/manifest.webmanifest",
  "public/rifq-logo.png",
  "components/NotificationManager.tsx",
  "app/notifications/NotificationSettings.tsx",
  "app/profile/ProfileView.tsx",
  "app/khatma/KhatmaPlanner.tsx",
  "app/audio/AudioPlayer.tsx",
  "capacitor.config.ts"
];

const requiredScripts = [
  "mushaf:download",
  "mushaf:check",
  "offline:download",
  "offline:check",
  "android:prepare",
  "android:open"
];

const requiredDependencies = [
  "@capacitor/app",
  "@capacitor/local-notifications"
];

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
const missingScripts = requiredScripts.filter((name) => !packageJson.scripts?.[name]);
const missingDependencies = requiredDependencies.filter((name) => !allDependencies[name]);

if (missingFiles.length || missingScripts.length || missingDependencies.length) {
  if (missingFiles.length) console.error("Missing files:", missingFiles.join(", "));
  if (missingScripts.length) console.error("Missing scripts:", missingScripts.join(", "));
  if (missingDependencies.length) console.error("Missing dependencies:", missingDependencies.join(", "));
  process.exit(1);
}

console.log("Release polish check passed.");
