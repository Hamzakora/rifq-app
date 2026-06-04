export type ReligiousTextType = "quran" | "hadith" | "tafsir" | "azkar";

export function assertServerOnlyReligiousContentMutation(
  type: ReligiousTextType,
  action: "create" | "update" | "delete"
): never {
  throw new Error(
    `Cannot ${action} ${type}.`
  );
}

export function buildSourceMeta(sourceName: string, sourceUrl?: string) {
  return {
    sourceName,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    immutable: true,
    generatedByAI: false
  };
}
