"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Headphones,
  Info,
  MessageCircle,
  Moon,
  Palette,
  Save,
  Share2,
  Sun,
  TimerReset,
  WifiOff,
} from "lucide-react";
import { DEFAULT_SETTINGS, readSettings, writeSettings, type QawraSettings } from "@/components/settingsStore";
import { countryCities } from "@/lib/sources/countriesCities";
import { QURAN_RECITERS } from "@/lib/quran/reciters";

type ThemeChoice = "light" | "dark";

type SettingsCardProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
};

function setAppTheme(theme: ThemeChoice) {
  localStorage.setItem("qawra-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.dispatchEvent(new Event("qawra-theme-change"));
}

function SettingsCard({ icon, title, description, children }: SettingsCardProps) {
  return (
    <section className="qawra-card">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
          {icon}
        </span>
        <div>
          <h2 className="text-2xl font-black text-[#31452c] dark:text-[#f7edda]">{title}</h2>
          {description ? <p className="mt-1 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-2xl bg-[#fbf7ef] px-4 py-3 font-black text-[#31452c] ring-1 ring-[#d8c094]/45 transition hover:bg-[#fff8e8] dark:bg-white/5 dark:text-[#f7edda] dark:ring-white/10 dark:hover:bg-white/10">
      {icon}
      {children}
    </Link>
  );
}

export function SettingsView() {
  const [settings, setSettings] = useState<QawraSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<ThemeChoice>("light");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setTheme(localStorage.getItem("qawra-theme") === "dark" ? "dark" : "light");
  }, []);

  const selectedCountry = countryCities.find((item) => item.country === settings.prayerCountry) || countryCities[0];

  function update<K extends keyof QawraSettings>(key: K, value: QawraSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function updateTheme(nextTheme: ThemeChoice) {
    setTheme(nextTheme);
    setAppTheme(nextTheme);
    setSaved(false);
  }

  function save() {
    writeSettings(settings);
    setAppTheme(theme);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <div className="qawra-card">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8e8] text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
            <Palette size={22} />
          </span>
          <div>
            <h1 className="qawra-title">الإعدادات</h1>
            <p className="mt-2 leading-8 text-slate-600 dark:text-slate-300">
              إعدادات رِفْق الأساسية في مكان واحد.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <SettingsCard
          icon={<Palette size={21} />}
          title="المظهر"
          description="اختَر الشكل المناسب لك."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateTheme("light")}
              className={`rounded-2xl border p-4 text-right font-black transition ${theme === "light" ? "border-[#3f5638] bg-[#3f5638] text-white" : "border-[#d8c094]/45 bg-[#fbf7ef] text-[#31452c] dark:bg-white/5 dark:text-[#f7edda]"}`}
            >
              <Sun size={22} className="mb-3" />
              وضع النهار
              <span className="mt-2 block text-xs font-bold opacity-80">مريح نهارًا</span>
            </button>
            <button
              type="button"
              onClick={() => updateTheme("dark")}
              className={`rounded-2xl border p-4 text-right font-black transition ${theme === "dark" ? "border-[#3f5638] bg-[#3f5638] text-white" : "border-[#d8c094]/45 bg-[#fbf7ef] text-[#31452c] dark:bg-white/5 dark:text-[#f7edda]"}`}
            >
              <Moon size={22} className="mb-3" />
              الوضع الداكن
              <span className="mt-2 block text-xs font-bold opacity-80">أفضل للقراءة ليلًا</span>
            </button>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<BookOpen size={21} />}
          title="القرآن والقراءة"
          description="فتح المصحف والتفسير."
        >
          <div className="rounded-3xl bg-[#fbf7ef] p-4 ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:ring-white/10">
            <p className="font-bold leading-8 text-slate-600 dark:text-slate-300">
              افتح القرآن واختر السورة. سيتم حفظ آخر موضع تلقائيًا.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ActionLink href="/quran" icon={<BookOpen size={18} />}>فتح القرآن</ActionLink>
              <ActionLink href="/tafsir" icon={<Info size={18} />}>التفسير</ActionLink>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<CalendarDays size={21} />}
          title="مواقيت الصلاة"
          description="اختر الدولة والمدينة الافتراضية."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">الدولة</span>
              <select
                value={settings.prayerCountry}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  const countryData = countryCities.find((item) => item.country === nextCountry) || countryCities[0];
                  setSettings((prev) => ({ ...prev, prayerCountry: nextCountry, prayerCity: countryData.cities[0]?.city || "Cairo" }));
                  setSaved(false);
                }}
                className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold dark:border-white/10 dark:bg-white/5"
              >
                {countryCities.map((item) => <option key={item.country} value={item.country}>{item.countryAr}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">المدينة</span>
              <select value={settings.prayerCity} onChange={(e) => update("prayerCity", e.target.value)} className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold dark:border-white/10 dark:bg-white/5">
                {selectedCountry.cities.map((item) => <option key={item.city} value={item.city}>{item.cityAr}</option>)}
              </select>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<Headphones size={21} />}
          title="الصوتيات الاختيارية"
          description="اختر القارئ المفضل للصوتيات."
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">القارئ الافتراضي</span>
              <select value={settings.reciter} onChange={(e) => update("reciter", e.target.value)} className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold dark:border-white/10 dark:bg-white/5">
                <optgroup label="شيوخ قدامى">
                  {QURAN_RECITERS.filter((r) => r.group === "classic").map((r) => <option key={r.edition} value={r.edition}>{r.name}</option>)}
                </optgroup>
                <optgroup label="شيوخ معاصرون">
                  {QURAN_RECITERS.filter((r) => r.group === "modern").map((r) => <option key={r.edition} value={r.edition}>{r.name}</option>)}
                </optgroup>
              </select>
            </label>
            <div className="rounded-3xl bg-[#fbf7ef] p-4 text-sm font-bold leading-7 text-slate-600 ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
              الصوتيات اختيارية ويمكن تحميلها من صفحة الاستماع.
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<TimerReset size={21} />}
          title="الختمة"
          description="حدد المدة الافتراضية عند إنشاء خطة ختمة جديدة."
        >
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">عدد أيام الختمة</span>
            <input type="number" min={1} max={365} value={settings.defaultKhatmaDays} onChange={(e) => update("defaultKhatmaDays", Number(e.target.value))} className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold dark:border-white/10 dark:bg-white/5" />
          </label>
        </SettingsCard>



        <SettingsCard
          icon={<Bell size={21} />}
          title="التنبيهات"
          description="أوقات الأذكار والورد والتنبيه قبل الصلاة."
        >
          <div className="rounded-3xl bg-[#fbf7ef] p-4 ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:ring-white/10">
            <p className="font-bold leading-8 text-slate-600 dark:text-slate-300">
              اضبط أوقات التذكير بالطريقة التي تناسبك.
            </p>
            <div className="mt-4">
              <ActionLink href="/notifications" icon={<Bell size={18} />}>إدارة التنبيهات</ActionLink>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<Share2 size={21} />}
          title="كروت المشاركة"
          description="اختر الشكل الافتراضي للكروت عند مشاركة آية أو ذكر."
        >
          <select value={settings.cardTheme} onChange={(e) => update("cardTheme", e.target.value as QawraSettings["cardTheme"])} className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold dark:border-white/10 dark:bg-white/5">
            <option value="emerald">أخضر زمردي</option>
            <option value="night">ليلي أزرق</option>
            <option value="gold">ذهبي فاخر</option>
          </select>
        </SettingsCard>

        <SettingsCard
          icon={<WifiOff size={21} />}
          title="التخزين والتحميلات"
          description="إدارة المحتوى المحمل."
        >
          <div className="space-y-4">
            <div className="grid gap-2 rounded-3xl bg-[#fbf7ef] p-4 text-sm font-bold leading-7 text-slate-600 ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
              <span>• المصحف والتفسير والأذكار والأحاديث متاحة دون اتصال.</span>
              <span>• مواقيت الصلاة تعمل من داخل التطبيق.</span>
              <span>• الصوتيات اختيارية.</span>
            </div>
            <ActionLink href="/audio" icon={<Headphones size={18} />}>إدارة الصوتيات</ActionLink>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<Info size={21} />}
          title="الدعم والمعلومات"
          description="التواصل عند وجود ملاحظة."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionLink href="/about" icon={<Info size={18} />}>عن رِفْق</ActionLink>
            <ActionLink href="/report" icon={<MessageCircle size={18} />}>بلاغ أو ملاحظة</ActionLink>
          </div>
        </SettingsCard>
      </section>

      <div className="qawra-card flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold text-slate-600 dark:text-slate-300">
          {saved ? "تم حفظ الإعدادات بنجاح." : "اضغط حفظ لتطبيق الإعدادات."}
        </p>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-6 py-3 font-black text-white transition hover:bg-[#31452c]">
          <Save size={17} />
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
