export type QuranReciter = {
  edition: string;
  name: string;
  group: "classic" | "modern";
  matchers: string[];
  server?: string;
  cdnEdition?: string;
  hasAyahAudio?: boolean;
};

export const QURAN_RECITERS: QuranReciter[] = [
  { edition: "ar.husary", name: "محمود خليل الحصري", group: "classic", matchers: ["الحصري", "محمود خليل"], server: "https://server13.mp3quran.net/husr/", cdnEdition: "ar.husary", hasAyahAudio: true },
  { edition: "ar.minshawi", name: "محمد صديق المنشاوي", group: "classic", matchers: ["المنشاوي", "محمد صديق"], server: "https://server10.mp3quran.net/minsh/", cdnEdition: "ar.minshawi", hasAyahAudio: true },
  { edition: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد - مرتل", group: "classic", matchers: ["عبد الباسط", "عبدالباسط"], server: "https://server7.mp3quran.net/basit/", cdnEdition: "ar.abdulbasitmurattal", hasAyahAudio: true },
  { edition: "ar.abdulbasitmujawwad", name: "عبد الباسط عبد الصمد - مجود", group: "classic", matchers: ["عبد الباسط", "عبدالباسط"], server: "https://server13.mp3quran.net/basit_mjwd/", cdnEdition: "ar.abdulbasitmujawwad", hasAyahAudio: true },
  { edition: "ar.banna", name: "محمود علي البنا", group: "classic", matchers: ["البنا", "محمود علي"], server: "https://server8.mp3quran.net/bna/" },
  { edition: "ar.mustafaismail", name: "مصطفى إسماعيل", group: "classic", matchers: ["مصطفى اسماعيل", "مصطفى إسماعيل"], server: "https://server8.mp3quran.net/mustafa/" },
  { edition: "ar.muhammadayyoub", name: "محمد أيوب", group: "classic", matchers: ["محمد ايوب", "محمد أيوب"], server: "https://server8.mp3quran.net/ayyub/", cdnEdition: "ar.muhammadayyoub", hasAyahAudio: true },
  { edition: "ar.alafasy", name: "مشاري العفاسي", group: "modern", matchers: ["العفاسي", "مشاري"], server: "https://server8.mp3quran.net/afs/", cdnEdition: "ar.alafasy", hasAyahAudio: true },
  { edition: "ar.mahermuaiqly", name: "ماهر المعيقلي", group: "modern", matchers: ["ماهر", "المعيقلي"], server: "https://server12.mp3quran.net/maher/", cdnEdition: "ar.mahermuaiqly", hasAyahAudio: true },
  { edition: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", group: "modern", matchers: ["السديس"], server: "https://server11.mp3quran.net/sds/", cdnEdition: "ar.abdurrahmaansudais", hasAyahAudio: true },
  { edition: "ar.saoodshuraym", name: "سعود الشريم", group: "modern", matchers: ["الشريم", "سعود"], server: "https://server7.mp3quran.net/shur/", cdnEdition: "ar.saoodshuraym", hasAyahAudio: true },
  { edition: "ar.hudhaify", name: "علي الحذيفي", group: "modern", matchers: ["الحذيفي", "علي بن عبدالرحمن"], server: "https://server9.mp3quran.net/hthfi/", cdnEdition: "ar.hudhaify", hasAyahAudio: true },
  { edition: "ar.ahmedajamy", name: "أحمد العجمي", group: "modern", matchers: ["العجمي", "احمد العجمي", "أحمد العجمي"], server: "https://server10.mp3quran.net/ajm/128/", cdnEdition: "ar.ahmedajamy", hasAyahAudio: true },
  { edition: "ar.saadalghamdi", name: "سعد الغامدي", group: "modern", matchers: ["الغامدي", "سعد"], server: "https://server7.mp3quran.net/s_gmd/" },
  { edition: "ar.faressabbad", name: "فارس عباد", group: "modern", matchers: ["فارس عباد", "فارس"], server: "https://server8.mp3quran.net/frs_a/" },
  { edition: "ar.yaserdossari", name: "ياسر الدوسري", group: "modern", matchers: ["الدوسري", "ياسر"], server: "https://server11.mp3quran.net/yasser/" },
  { edition: "ar.nasserqatami", name: "ناصر القطامي", group: "modern", matchers: ["القطامي", "ناصر"], server: "https://server6.mp3quran.net/qtm/" },
  { edition: "ar.abdullahbasfar", name: "عبد الله بصفر", group: "modern", matchers: ["بصفر", "عبد الله بصفر", "عبدالله بصفر"], server: "https://server6.mp3quran.net/bsfr/", cdnEdition: "ar.abdullahbasfar", hasAyahAudio: true },
  { edition: "ar.muhammadjibreel", name: "محمد جبريل", group: "modern", matchers: ["محمد جبريل", "جبريل"], server: "https://server8.mp3quran.net/jbrl/", cdnEdition: "ar.muhammadjibreel", hasAyahAudio: true }
];

export function getReciterByEdition(edition: string) {
  return QURAN_RECITERS.find((reciter) => reciter.edition === edition) || QURAN_RECITERS[0];
}

export function isAvailableReciter(edition: string) {
  return QURAN_RECITERS.some((reciter) => reciter.edition === edition);
}

export function padSurahNumber(chapter: number) {
  return String(Math.max(1, Math.min(114, chapter))).padStart(3, "0");
}

function buildIslamicNetworkSurahUrl(edition: string, chapter: number) {
  const safeEdition = edition.replace(/[^a-zA-Z0-9._-]/g, "");
  return `https://cdn.islamic.network/quran/audio-surah/128/${safeEdition}/${chapter}.mp3`;
}

export function getQuranSurahAudioCandidates(edition: string, chapter: number) {
  const reciter = getReciterByEdition(edition);
  const urls = [
    reciter.server ? `${reciter.server}${padSurahNumber(chapter)}.mp3` : "",
    reciter.cdnEdition ? buildIslamicNetworkSurahUrl(reciter.cdnEdition, chapter) : ""
  ];

  return Array.from(new Set(urls.filter(Boolean)));
}

export function getAyahAudioEdition(edition: string) {
  const reciter = getReciterByEdition(edition);
  return reciter.hasAyahAudio ? reciter.cdnEdition || reciter.edition : null;
}
