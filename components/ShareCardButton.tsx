"use client";

import { Copy, Download, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { readSettings } from "@/components/settingsStore";

type ShareCardButtonProps = {
  title: string;
  text: string;
  subtitle?: string;
  source?: string;
};

type CardTheme = "emerald" | "night" | "gold";

type NativeNavigator = Navigator & {
  share?: (data?: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
};

function getNativeNavigator(): NativeNavigator {
  return navigator as NativeNavigator;
}


function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapLines(text: string, max = 34, limit = 10) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }

    if (lines.length >= limit) break;
  }

  if (line && lines.length < limit) lines.push(line);
  return lines;
}

export function ShareCardButton({ title, text, subtitle, source }: ShareCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [theme, setTheme] = useState<CardTheme>("emerald");

  useEffect(() => {
    setTheme(readSettings().cardTheme as CardTheme);
  }, []);

  const colors = {
    emerald: { bg: "#063f35", bg2: "#0f766e", accent: "#fffaf0", soft: "#d1fae5", gold: "#f8c56b" },
    night: { bg: "#020617", bg2: "#13233d", accent: "#f8fafc", soft: "#bfdbfe", gold: "#93c5fd" },
    gold: { bg: "#35240b", bg2: "#6b4f16", accent: "#fffbeb", soft: "#fde68a", gold: "#fbbf24" }
  }[theme];

  const svg = useMemo(() => {
    const lines = wrapLines(text);
    const startY = subtitle ? 348 : 318;
    const tspans = lines
      .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : 52}">${escapeXml(line)}</tspan>`)
      .join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" direction="rtl">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.bg2}"/>
      <stop offset="50%" stop-color="${colors.bg}"/>
      <stop offset="100%" stop-color="#031b18"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="16%" r="70%">
      <stop offset="0%" stop-color="${colors.gold}" stop-opacity=".34"/>
      <stop offset="60%" stop-color="${colors.bg}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".25"/>
    </filter>
  </defs>
  <rect width="1080" height="1080" rx="78" fill="url(#bg)"/>
  <rect width="1080" height="1080" rx="78" fill="url(#glow)"/>
  <circle cx="124" cy="148" r="78" fill="${colors.gold}" opacity=".11"/>
  <circle cx="956" cy="920" r="120" fill="${colors.soft}" opacity=".08"/>
  <rect x="72" y="72" width="936" height="936" rx="54" fill="none" stroke="${colors.soft}" stroke-opacity=".46" stroke-width="5"/>
  <rect x="108" y="108" width="864" height="864" rx="38" fill="#ffffff" opacity=".055" stroke="${colors.gold}" stroke-opacity=".62" stroke-width="2"/>
  <path d="M220 236 C320 178 760 178 860 236" fill="none" stroke="${colors.gold}" stroke-opacity=".55" stroke-width="3"/>
  <text x="540" y="166" text-anchor="middle" fill="${colors.gold}" font-family="Arial, Tahoma" font-size="42" font-weight="900">رِفْق</text>
  <text x="540" y="236" text-anchor="middle" fill="${colors.accent}" font-family="Arial, Tahoma" font-size="46" font-weight="900">${escapeXml(title)}</text>
  ${subtitle ? `<text x="540" y="292" text-anchor="middle" fill="${colors.soft}" font-family="Arial, Tahoma" font-size="28" font-weight="800">${escapeXml(subtitle)}</text>` : ""}
  <g filter="url(#shadow)">
    <rect x="150" y="${subtitle ? 323 : 292}" width="780" height="470" rx="38" fill="#fffaf0" opacity=".10"/>
  </g>
  <text x="540" y="${startY}" text-anchor="middle" fill="${colors.accent}" font-family="Traditional Arabic, Arial, Tahoma" font-size="47" font-weight="700">${tspans}</text>
  <line x1="300" y1="862" x2="780" y2="862" stroke="${colors.gold}" stroke-opacity=".55" stroke-width="2"/>
  <text x="540" y="924" text-anchor="middle" fill="${colors.soft}" font-family="Arial, Tahoma" font-size="25" font-weight="800">${escapeXml(source || "رِفْق")}</text>
  <text x="540" y="970" text-anchor="middle" fill="${colors.gold}" font-family="Arial, Tahoma" font-size="30" font-weight="900">شارك الخير بنية طيبة</text>
</svg>`;
  }, [text, title, subtitle, source, colors]);

  async function svgToPngFile() {
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not supported in this browser.");

      context.drawImage(image, 0, 0, 1080, 1080);
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.96));
      if (!pngBlob) throw new Error("PNG export failed.");

      return new File([pngBlob], "rifq-share-card.png", { type: "image/png" });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function downloadPng() {
    const file = await svgToPngFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyText() {
    await navigator.clipboard.writeText(`${title}\n\n${text}`);
    setCopied(true);
    setShareMessage("تم نسخ النص.");
    setTimeout(() => setCopied(false), 1400);
  }

  async function shareText() {
    const nativeNavigator = getNativeNavigator();

    if (typeof nativeNavigator.share === "function") {
      await nativeNavigator.share({ title, text: `${title}\n\n${text}` });
      return;
    }

    await copyText();
  }

  async function shareCard() {
    setShareMessage("");

    try {
      const file = await svgToPngFile();
      const sharePayload = { title, text: `${title}\n\n${text}`, files: [file] };

      const nativeNavigator = getNativeNavigator();

      if (
        typeof nativeNavigator.share === "function" &&
        (typeof nativeNavigator.canShare !== "function" || nativeNavigator.canShare(sharePayload))
      ) {
        await nativeNavigator.share(sharePayload);
        return;
      }

      if (typeof nativeNavigator.share === "function") {
        await shareText();
        return;
      }

      await downloadPng();
      setOpen(true);
      setShareMessage("المتصفح لا يدعم نافذة المشاركة هنا، تم تحميل الكارت كصورة PNG.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyText();
      setOpen(true);
      setShareMessage("تعذر فتح نافذة المشاركة، فتم نسخ النص بدلًا من ذلك.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={shareCard}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
      >
        <Share2 size={16} />
        كارت مشاركة
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black">معاينة كارت المشاركة</h3>
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
              <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt="كارت مشاركة" className="w-full" />
            </div>

            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
              <button onClick={shareCard} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow-lg shadow-emerald-900/10">
                <Share2 size={17} />
                مشاركة الكارت
              </button>
              <button onClick={downloadPng} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-black dark:bg-slate-800">
                <Download size={17} />
                تحميل PNG
              </button>
              <button onClick={copyText} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-black dark:bg-slate-800">
                <Copy size={17} />
                {copied ? "تم النسخ" : "نسخ النص"}
              </button>
            </div>

            {shareMessage && <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{shareMessage}</p>}
          </div>
        </div>
      )}
    </>
  );
}
