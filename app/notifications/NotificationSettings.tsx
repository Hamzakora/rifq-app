"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, BellOff, BellRing, BookOpen, Clock3, Heart, RotateCcw, Save, ShieldCheck } from "lucide-react";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_NOTIFICATION_TIMES,
  cancelNativeNotifications,
  getNotificationState,
  notificationStateLabel,
  readNotificationSettings,
  requestNotificationPermission,
  scheduleNativeNotifications,
  writeNotificationSettings,
  type RifqNotificationSettings,
  type RifqNotificationState
} from "@/lib/client/notificationsStore";

function toArabicNumber(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const suffix = hours < 12 ? "ص" : "م";
  const hour12 = hours % 12 || 12;
  return `${toArabicNumber(hour12)}:${toArabicNumber(String(minutes).padStart(2, "0"))} ${suffix}`;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  children
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#d8c094]/35 bg-white/75 p-4 ring-1 ring-white/60 dark:border-white/10 dark:bg-white/[0.04] dark:ring-white/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-[#31452c] dark:text-[#f7edda]">{title}</h3>
          <p className="mt-1 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`w-fit rounded-full px-5 py-2 text-sm font-black transition ${checked ? "bg-[#3f5638] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}
        >
          {checked ? "مفعل" : "متوقف"}
        </button>
      </div>
      {checked && children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function TimeInput({ value, defaultValue, onChange }: { value: string; defaultValue: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <label className="block max-w-xs">
        <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">موعد التذكير</span>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-white/5"
        />
      </label>
      <div className="rounded-2xl bg-[#fbf7ef] px-4 py-3 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#efdcb6] dark:ring-white/10">
        الافتراضي: {formatTime(defaultValue)}
      </div>
    </div>
  );
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<RifqNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [state, setState] = useState<RifqNotificationState>("default");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(readNotificationSettings());
    getNotificationState().then(setState).catch(() => setState("default"));
  }, []);

  function update<K extends keyof RifqNotificationSettings>(key: K, value: RifqNotificationSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  }

  function resetDefaultTimes() {
    setSettings((prev) => ({
      ...prev,
      morningTime: DEFAULT_NOTIFICATION_TIMES.morningTime,
      eveningTime: DEFAULT_NOTIFICATION_TIMES.eveningTime,
      khatmaTime: DEFAULT_NOTIFICATION_TIMES.khatmaTime
    }));
    setMessage("تمت استعادة الأوقات الافتراضية. اضغط حفظ لتطبيقها.");
  }

  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    setState(permission);

    if (permission !== "granted") {
      setMessage("لم يتم تفعيل التنبيهات.");
      return;
    }

    const next = { ...settings, enabled: true };
    setSettings(next);
    writeNotificationSettings(next);
    await scheduleNativeNotifications(next);
    setMessage("تم تفعيل التنبيهات.");
  }

  async function disableNotifications() {
    const next = { ...settings, enabled: false };
    setSettings(next);
    writeNotificationSettings(next);
    await cancelNativeNotifications();
    setMessage("تم إيقاف التنبيهات.");
  }

  async function save() {
    const next = { ...settings, prayerOffsetMinutes: Math.max(0, Math.min(30, Number(settings.prayerOffsetMinutes) || 0)) };
    setSettings(next);
    writeNotificationSettings(next);

    if (next.enabled) {
      const permission = await getNotificationState();
      setState(permission);
      if (permission === "granted") await scheduleNativeNotifications(next);
    }

    setMessage("تم حفظ التنبيهات.");
  }

  return (
    <div className="space-y-5">
      <section className="qawra-card">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8e8] p-3 text-[#3f5638] ring-1 ring-[#d8c094]/45 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <BellRing size={24} />
            </span>
            <div>
              <h1 className="qawra-title">التنبيهات</h1>
              <p className="mt-2 max-w-2xl leading-8 text-slate-600 dark:text-slate-300">
                فعّل ما يناسبك، وغيّر أوقات الأذكار والورد كما تحب.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fbf7ef] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#efdcb6] dark:ring-white/10">
              <ShieldCheck size={16} />
              {notificationStateLabel(state)}
            </span>
            {!settings.enabled || state !== "granted" ? (
              <button onClick={enableNotifications} className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white">
                <Bell size={17} />
                تفعيل التنبيهات
              </button>
            ) : (
              <button onClick={disableNotifications} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 font-black text-red-700 dark:bg-red-950/30 dark:text-red-200">
                <BellOff size={17} />
                إيقاف التنبيهات
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ToggleRow
          title="أذكار الصباح"
          description="تذكير يومي في الوقت الذي تختاره."
          checked={settings.morningAzkar}
          onChange={(value) => update("morningAzkar", value)}
        >
          <TimeInput value={settings.morningTime} defaultValue={DEFAULT_NOTIFICATION_TIMES.morningTime} onChange={(value) => update("morningTime", value)} />
        </ToggleRow>

        <ToggleRow
          title="أذكار المساء"
          description="اختر موعدًا يناسب يومك."
          checked={settings.eveningAzkar}
          onChange={(value) => update("eveningAzkar", value)}
        >
          <TimeInput value={settings.eveningTime} defaultValue={DEFAULT_NOTIFICATION_TIMES.eveningTime} onChange={(value) => update("eveningTime", value)} />
        </ToggleRow>

        <ToggleRow
          title="ورد القرآن"
          description="تذكير يومي بورد الختمة."
          checked={settings.khatma}
          onChange={(value) => update("khatma", value)}
        >
          <TimeInput value={settings.khatmaTime} defaultValue={DEFAULT_NOTIFICATION_TIMES.khatmaTime} onChange={(value) => update("khatmaTime", value)} />
        </ToggleRow>

        <ToggleRow
          title="الصلاة"
          description="تنبيه بسيط حسب المدينة المحفوظة في مواقيت الصلاة."
          checked={settings.prayer}
          onChange={(value) => update("prayer", value)}
        >
          <label className="block max-w-xs">
            <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">قبل الصلاة بدقائق</span>
            <select
              value={settings.prayerOffsetMinutes}
              onChange={(e) => update("prayerOffsetMinutes", Number(e.target.value))}
              className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-white/5"
            >
              <option value={0}>وقت الصلاة</option>
              <option value={5}>٥ دقائق</option>
              <option value={10}>١٠ دقائق</option>
              <option value={15}>١٥ دقيقة</option>
              <option value={30}>٣٠ دقيقة</option>
            </select>
          </label>
        </ToggleRow>
      </section>

      <section className="qawra-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold text-slate-600 dark:text-slate-300">{message || "احفظ اختياراتك بعد التعديل."}</p>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
            الأوقات الافتراضية: الصباح {formatTime(DEFAULT_NOTIFICATION_TIMES.morningTime)}، المساء {formatTime(DEFAULT_NOTIFICATION_TIMES.eveningTime)}، الورد {formatTime(DEFAULT_NOTIFICATION_TIMES.khatmaTime)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={resetDefaultTimes} className="inline-flex items-center gap-2 rounded-2xl bg-[#fbf7ef] px-5 py-3 font-black text-[#31452c] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#f7edda] dark:ring-white/10">
            <RotateCcw size={17} />
            الأوقات الافتراضية
          </button>
          <Link href="/prayer-times" className="inline-flex items-center gap-2 rounded-2xl bg-[#fbf7ef] px-5 py-3 font-black text-[#31452c] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#f7edda] dark:ring-white/10">
            <Clock3 size={17} />
            مواقيت الصلاة
          </Link>
          <Link href="/khatma" className="inline-flex items-center gap-2 rounded-2xl bg-[#fbf7ef] px-5 py-3 font-black text-[#31452c] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#f7edda] dark:ring-white/10">
            <BookOpen size={17} />
            الختمة
          </Link>
          <Link href="/azkar" className="inline-flex items-center gap-2 rounded-2xl bg-[#fbf7ef] px-5 py-3 font-black text-[#31452c] ring-1 ring-[#d8c094]/45 dark:bg-white/5 dark:text-[#f7edda] dark:ring-white/10">
            <Heart size={17} />
            الأذكار
          </Link>
          <button onClick={save} className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-6 py-3 font-black text-white">
            <Save size={17} />
            حفظ
          </button>
        </div>
      </section>
    </div>
  );
}
