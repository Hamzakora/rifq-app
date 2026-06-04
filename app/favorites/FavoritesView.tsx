"use client";

import { useEffect, useState } from "react";
import { clearFavorites, getFavorites, removeFavorite, type FavoriteItem } from "@/components/FavoriteButton";
import { Trash2 } from "lucide-react";

function itemTypeLabel(type: FavoriteItem["type"]) {
  if (type === "quran") return "قرآن";
  if (type === "tafsir") return "تفسير";
  if (type === "hadith") return "حديث";
  return "ذكر";
}


export function FavoritesView() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  function sync() {
    setItems(getFavorites());
  }

  useEffect(() => {
    sync();
    window.addEventListener("qawra-favorites-change", sync);
    return () => window.removeEventListener("qawra-favorites-change", sync);
  }, []);

  return (
    <div className="space-y-5">
      <div className="qawra-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="qawra-title">المحفوظات</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">كل ما حفظته من آيات وتفاسير وأحاديث وأذكار.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              clearFavorites();
              sync();
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700 dark:bg-red-950/30 dark:text-red-200"
          >
            <Trash2 size={17} />
            حذف الكل
          </button>
        )}
      </div>

      {items.length === 0 && <div className="qawra-card text-slate-500 dark:text-slate-400">لا توجد محفوظات بعد.</div>}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="qawra-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">{itemTypeLabel(item.type)}</p>
                <h2 className="text-xl font-black">{item.title}</h2>
              </div>
              <button
                onClick={() => {
                  removeFavorite(item.id);
                  sync();
                }}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black dark:bg-slate-800"
              >
                حذف
              </button>
            </div>
            <p className="whitespace-pre-line text-lg font-bold leading-9">{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
