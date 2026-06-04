"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function readDarkMode() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(readDarkMode());
    sync();
    window.addEventListener("qawra-theme-change", sync);
    return () => window.removeEventListener("qawra-theme-change", sync);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("qawra-theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("qawra-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#d8c094]/55 bg-white/85 text-[#3f5638] shadow-sm ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-[#fff8ec] hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-[#d8c094] dark:ring-white/5 dark:hover:bg-white/15"
      title={dark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
