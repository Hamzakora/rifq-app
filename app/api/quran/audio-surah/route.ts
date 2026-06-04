import { NextRequest, NextResponse } from "next/server";
import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { auditLog } from "@/lib/security/auditLog";
import { getQuranSurahAudioCandidates, getReciterByEdition } from "@/lib/quran/reciters";

const MP3_QURAN_RECITERS_API = "https://www.mp3quran.net/api/v3/reciters?language=ar";
const ISLAMIC_NETWORK_CDN = "https://cdn.islamic.network/quran/audio-surah/128";

type Moshaf = {
  id?: number;
  name?: string;
  server?: string;
  surah_total?: number;
  surah_list?: string;
};

type Reciter = {
  id?: number;
  name?: string;
  moshaf?: Moshaf[];
};

function padSurah(chapter: number) {
  return String(chapter).padStart(3, "0");
}

function normalizeText(value: string) {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase();
}

function editionFallbackUrl(edition: string, chapter: number) {
  const safeEdition = edition.replace(/[^a-zA-Z0-9._-]/g, "");
  return `${ISLAMIC_NETWORK_CDN}/${safeEdition}/${chapter}.mp3`;
}

function hasSurah(moshaf: Moshaf, chapter: number) {
  if (!moshaf.surah_list) return false;
  return moshaf.surah_list.split(",").map((item) => Number(item.trim())).includes(chapter);
}

function scoreMoshaf(moshaf: Moshaf, edition: string) {
  const name = normalizeText(moshaf.name || "");
  let score = 0;

  if ((moshaf.surah_total || 0) >= 114) score += 50;
  if (name.includes("حفص")) score += 20;
  if (name.includes("مرتل")) score += 10;
  if (edition.includes("mujawwad") && name.includes("مجود")) score += 20;
  if (edition.includes("murattal") && name.includes("مرتل")) score += 20;
  if (!edition.includes("mujawwad") && name.includes("مجود")) score -= 5;

  return score;
}

async function getMp3QuranCandidate(edition: string, chapter: number) {
  const tokens = getReciterByEdition(edition).matchers;
  const normalizedTokens = tokens.map(normalizeText);

  const res = await fetch(MP3_QURAN_RECITERS_API, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!res.ok) throw new Error(`MP3Quran reciters request failed: ${res.status}`);

  const json = await res.json();
  const reciters: Reciter[] = Array.isArray(json?.reciters) ? json.reciters : [];

  const matchedReciters = reciters.filter((reciter) => {
    const name = normalizeText(reciter.name || "");
    return normalizedTokens.some((token) => name.includes(token));
  });

  const candidates = matchedReciters
    .flatMap((reciter) =>
      (reciter.moshaf || [])
        .filter((moshaf) => moshaf.server && hasSurah(moshaf, chapter))
        .map((moshaf) => ({ reciter, moshaf, score: scoreMoshaf(moshaf, edition) }))
    )
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best?.moshaf?.server) return null;

  const server = best.moshaf.server.endsWith("/") ? best.moshaf.server : `${best.moshaf.server}/`;

  return {
    audioUrl: `${server}${padSurah(chapter)}.mp3`,
    source: "MP3Quran.net",
    reciterName: best.reciter.name || "القارئ",
    moshafName: best.moshaf.name || "رواية حفص عن عاصم",
    moshafServer: server
  };
}

export async function GET(request: NextRequest) {
  try {
    const chapter = Number(request.nextUrl.searchParams.get("chapter") || "1");
    const edition = request.nextUrl.searchParams.get("edition") || "ar.alafasy";

    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114) {
      return NextResponse.json({ error: "رقم السورة غير صحيح." }, { status: 400 });
    }

    const safeEdition = edition.replace(/[^a-zA-Z0-9._-]/g, "");
    const fallbackUrl = editionFallbackUrl(safeEdition, chapter);
    const candidates: string[] = getQuranSurahAudioCandidates(safeEdition, chapter);
    let source = "MP3Quran.net";
    let reciterName = safeEdition;
    let moshafName = "السورة كاملة";

    try {
      const mp3Quran = await getMp3QuranCandidate(safeEdition, chapter);
      if (mp3Quran?.audioUrl) {
        candidates.push(mp3Quran.audioUrl);
        source = mp3Quran.source;
        reciterName = mp3Quran.reciterName;
        moshafName = mp3Quran.moshafName;
      }
    } catch {
      // Keep fallback below. Audio should fail gracefully rather than breaking the page.
    }

    candidates.push(fallbackUrl);

    const uniqueCandidates = Array.from(new Set(candidates));
    const audioUrl = uniqueCandidates[0];

    await auditLog({
      action: "read",
      target: "quran.audio-surah",
      metadata: { chapter, edition: safeEdition, source, reciterName, moshafName }
    });

    return NextResponse.json({
      data: {
        chapter,
        edition: safeEdition,
        audioUrl,
        candidates: uniqueCandidates,
        source,
        reciterName,
        moshafName
      },
      meta: buildSourceMeta(source, audioUrl)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
