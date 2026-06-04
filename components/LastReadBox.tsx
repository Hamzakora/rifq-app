"use client";

import Link from "next/link";
import { BookOpen, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

type LastRead = {
  chapter: number;
  chapterName: string;
  ayah: number;
  page?: number;
  savedAt: string;
};

const KEY = "qawra-last-read-v1";

export function saveLastRead(item: LastRead) {
  localStorage.setItem(KEY, JSON.stringify(item));
  window.dispatchEvent(new Event("qawra-last-read-change"));
}

export function getLastRead(): LastRead | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function LastReadBox() {
  const [item, setItem] = useState<LastRead | null>(null);

  useEffect(() => {
    function sync() {
      setItem(getLastRead());
    }
    sync();
    window.addEventListener("qawra-last-read-change", sync);
    return () => window.removeEventListener("qawra-last-read-change", sync);
  }, []);

  if (!item) {
    return (
      <div className="rounded-3xl border border-[#d8c094]/35 bg-white/70 p-5 text-[#746a58] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-[#d8cfc0]">
        لم يتم حفظ موضع قراءة بعد.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#d8c094]/40 bg-[#fbf7ef]/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#3f5638] text-white">
            <BookOpen size={20} />
          </span>
          <div>
            <p className="text-sm font-black text-[#7f6a39] dark:text-[#d8c094]">آخر قراءة</p>
            <h3 className="font-black text-[#3f5638] dark:text-[#f7edda]">
              سورة {item.chapterName} — الآية {item.ayah}{item.page ? ` — صفحة ${item.page}` : ""}
            </h3>
          </div>
        </div>
        <Link
          href={item.page ? `/quran?page=${item.page}` : `/quran?chapter=${item.chapter}&ayah=${item.ayah}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-4 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 transition hover:-translate-y-0.5"
        >
          <RotateCcw size={17} />
          استكمال القراءة
        </Link>
      </div>
    </div>
  );
}
