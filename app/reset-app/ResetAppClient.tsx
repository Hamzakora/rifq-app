"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

async function resetAppStorage() {
  let count = 0;

  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
    count += regs.length;
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    count += keys.length;
  }

  return count;
}

export function ResetAppClient() {
  const [message, setMessage] = useState("جاري تحديث بيانات التطبيق...");

  useEffect(() => {
    resetAppStorage()
      .then(() => setMessage("تم تحديث بيانات التطبيق."))
      .catch(() => setMessage("تعذر التحديث الآن."));
  }, []);

  return (
    <div className="qawra-card text-center">
      <h1 className="qawra-title">تحديث التطبيق</h1>
      <p className="mt-5 rounded-2xl bg-slate-50 p-3 font-bold dark:bg-slate-950">{message}</p>
      <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">
        ارجع للرئيسية وافتح التطبيق مرة أخرى.
      </p>
      <Link href="/" className="mt-5 inline-block rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white">
        الرجوع للرئيسية
      </Link>
    </div>
  );
}
