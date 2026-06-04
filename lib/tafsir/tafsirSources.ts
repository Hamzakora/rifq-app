export type TafsirSource = {
  id: string;
  label: string;
  sourceName: string;
  onlineOnly?: boolean;
  slug?: string;
};

export const TAFSIR_SOURCES: TafsirSource[] = [
  { id: "muyassar", label: "التفسير الميسر", sourceName: "التفسير الميسر المحلي" },
  { id: "ibn-kathir", label: "ابن كثير", sourceName: "تفسير ابن كثير", onlineOnly: true, slug: "ar-tafsir-ibn-kathir" },
  { id: "saadi", label: "السعدي", sourceName: "تفسير السعدي", onlineOnly: true, slug: "ar-tafseer-al-saddi" },
  { id: "tabari", label: "الطبري", sourceName: "تفسير الطبري", onlineOnly: true, slug: "ar-tafsir-al-tabari" },
  { id: "qurtubi", label: "القرطبي", sourceName: "تفسير القرطبي", onlineOnly: true, slug: "ar-tafseer-al-qurtubi" }
];

export function getTafsirSource(id: string) {
  return TAFSIR_SOURCES.find((source) => source.id === id) || TAFSIR_SOURCES[0];
}
