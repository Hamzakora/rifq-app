"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { recordActivityAction } from "@/lib/client/activityStore";

export type FavoriteItem = {
  id: string;
  type: "quran" | "tafsir" | "hadith" | "azkar";
  title: string;
  text: string;
  source?: string;
  url?: string;
  createdAt: string;
};

const KEY = "qawra-favorites-v1";

function readFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("qawra-favorites-change"));
}

export function addFavorite(item: Omit<FavoriteItem, "createdAt">) {
  const list = readFavorites();
  const exists = list.some((x) => x.id === item.id);
  const next = exists
    ? list.filter((x) => x.id !== item.id)
    : [{ ...item, createdAt: new Date().toISOString() }, ...list];

  writeFavorites(next);
  recordActivityAction("favorite", exists ? `حذفت ${item.title} من المفضلة` : `أضفت ${item.title} إلى المفضلة`);
  return !exists;
}

export function getFavorites() {
  return readFavorites();
}

export function clearFavorites() {
  writeFavorites([]);
}

export function removeFavorite(id: string) {
  writeFavorites(readFavorites().filter((x) => x.id !== id));
}

export function FavoriteButton({ item }: { item: Omit<FavoriteItem, "createdAt"> }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function sync() {
      setActive(readFavorites().some((x) => x.id === item.id));
    }
    sync();
    window.addEventListener("qawra-favorites-change", sync);
    return () => window.removeEventListener("qawra-favorites-change", sync);
  }, [item.id]);

  return (
    <button
      type="button"
      onClick={() => setActive(addFavorite(item))}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
        active
          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
      }`}
    >
      <Heart size={16} fill={active ? "currentColor" : "none"} />
      {active ? "محفوظ" : "حفظ"}
    </button>
  );
}
