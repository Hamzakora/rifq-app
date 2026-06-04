"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  Send,
} from "lucide-react";

type ReportKind =
  | "خطأ في القرآن"
  | "مشكلة في التفسير"
  | "مشكلة في الصوتيات"
  | "مشكلة في الأذكار"
  | "مشكلة في التصميم"
  | "اقتراح تطوير"
  | "أخرى";

type ReportSection =
  | "الرئيسية"
  | "القرآن"
  | "التفسير"
  | "الصوتيات"
  | "الأذكار"
  | "الحديث"
  | "الإعدادات"
  | "أخرى";

type Priority = "بسيطة" | "متوسطة" | "مهمة" | "عاجلة";

type SubmitState = "idle" | "sending" | "success" | "error";

const reportKinds: ReportKind[] = [
  "خطأ في القرآن",
  "مشكلة في التفسير",
  "مشكلة في الصوتيات",
  "مشكلة في الأذكار",
  "مشكلة في التصميم",
  "اقتراح تطوير",
  "أخرى",
];

const sections: ReportSection[] = [
  "الرئيسية",
  "القرآن",
  "التفسير",
  "الصوتيات",
  "الأذكار",
  "الحديث",
  "الإعدادات",
  "أخرى",
];

const priorities: Priority[] = ["بسيطة", "متوسطة", "مهمة", "عاجلة"];

function FieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-2 block text-sm font-black text-[#31452c] dark:text-[#f7edda]">
      {children}
      {required && <span className="mr-1 text-[#b14545]">*</span>}
    </span>
  );
}

export function ReportIssueClient() {
  const [kind, setKind] = useState<ReportKind>("مشكلة في التصميم");
  const [section, setSection] = useState<ReportSection>("أخرى");
  const [priority, setPriority] = useState<Priority>("متوسطة");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [reportTime, setReportTime] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setCurrentUrl(window.location.href);
    setDeviceInfo(window.navigator.userAgent || "غير متاح");
    setReportTime(new Date().toLocaleString("ar-EG"));

    const path = window.location.pathname;
    if (path.includes("quran")) setSection("القرآن");
    else if (path.includes("tafsir")) setSection("التفسير");
    else if (path.includes("audio")) setSection("الصوتيات");
    else if (path.includes("azkar")) setSection("الأذكار");
    else if (path.includes("hadith")) setSection("الحديث");
    else if (path.includes("settings")) setSection("الإعدادات");
  }, []);

  const reportText = useMemo(() => {
    const lines = [
      "بلاغ أو ملاحظة عن تطبيق رفق",
      "----------------------------",
      `نوع البلاغ: ${kind}`,
      `القسم / الصفحة: ${section}`,
      `الأهمية: ${priority}`,
      `العنوان المختصر: ${title || "غير محدد"}`,
      "",
      "وصف المشكلة:",
      details || "لم يتم إدخال وصف.",
      "",
      `وسيلة تواصل اختيارية: ${contact || "غير مضافة"}`,
      `رابط الصفحة: ${currentUrl || "غير متاح"}`,
      `معلومات الجهاز: ${deviceInfo || "غير متاح"}`,
      `وقت البلاغ: ${reportTime || "سيتم تحديده عند الإرسال"}`,
      "",
      "رابط التطبيق: https://rifq-app.vercel.app",
    ];

    return lines.join("\n");
  }, [kind, section, priority, title, details, contact, currentUrl, deviceInfo, reportTime]);

  const canSubmit = title.trim().length >= 3 && details.trim().length >= 10;

  function setSuccessMessage(text: string) {
    setStatus("success");
    setStatusText(text);
  }

  function setErrorMessage(text: string) {
    setStatus("error");
    setStatusText(text);
  }

  async function submitReport() {
    if (!canSubmit) {
      setErrorMessage("اكتب عنوانًا مختصرًا لا يقل عن 3 أحرف ووصفًا لا يقل عن 10 أحرف قبل إرسال البلاغ.");
      return;
    }

    setStatus("sending");
    setStatusText("جارٍ إرسال البلاغ...");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          section,
          priority,
          title: title.trim(),
          details: details.trim(),
          contact: contact.trim(),
          pageUrl: currentUrl,
          deviceInfo,
          reportText,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || "تعذر إرسال البلاغ الآن.");
      }

      setSuccessMessage("تم إرسال البلاغ بنجاح. شكرًا لمساعدتك في تحسين تطبيق رِفْق.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر إرسال البلاغ الآن. حاول مرة أخرى بعد قليل.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="qawra-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1fr_.75fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-4 py-2 text-sm font-black text-[#7b6431] ring-1 ring-[#d8c094]/55 dark:bg-white/10 dark:text-[#efdcb6] dark:ring-white/10">
              <MessageSquareWarning size={16} />
              مركز الملاحظات
            </div>
            <h1 className="text-4xl font-black leading-[1.3] text-[#31452c] dark:text-[#f7edda]">
              إرسال بلاغ أو ملاحظة
            </h1>
            <p className="mt-4 max-w-3xl font-bold leading-8 text-[#746a58] dark:text-[#d8cfc0]">
              ساعدنا في تحسين رِفْق. اكتب نوع المشكلة ومكان ظهورها، ثم اضغط إرسال البلاغ ليصل إلى فريق التطبيق مباشرة.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#d8c094]/45 bg-[#fff8e8] p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 text-[#b5954d]" size={24} />
              <div>
                <h2 className="font-black text-[#31452c] dark:text-[#f7edda]">قبل الإرسال</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#746a58] dark:text-[#d8cfc0]">
                  في أخطاء القرآن أو التفسير، اكتب اسم السورة ورقم الآية ورقم الصفحة إن أمكن، حتى يسهل فحص البلاغ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="qawra-card space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <FieldLabel required>نوع البلاغ</FieldLabel>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ReportKind)}
              className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold text-[#31452c] outline-none focus:ring-2 focus:ring-[#3f5638]/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f7edda]"
            >
              {reportKinds.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel required>القسم أو الصفحة</FieldLabel>
            <select
              value={section}
              onChange={(event) => setSection(event.target.value as ReportSection)}
              className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold text-[#31452c] outline-none focus:ring-2 focus:ring-[#3f5638]/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f7edda]"
            >
              {sections.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel>درجة الأهمية</FieldLabel>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold text-[#31452c] outline-none focus:ring-2 focus:ring-[#3f5638]/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f7edda]"
            >
              {priorities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <FieldLabel required>عنوان مختصر للمشكلة</FieldLabel>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثال: صورة صفحة المصحف لا تظهر، أو صوت القارئ لا يعمل"
            className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold text-[#31452c] outline-none focus:ring-2 focus:ring-[#3f5638]/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f7edda]"
          />
        </label>

        <label className="block">
          <FieldLabel required>وصف المشكلة بالتفصيل</FieldLabel>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={7}
            placeholder="اكتب ماذا حدث، والخطوات التي سبقت المشكلة، ونوع الجهاز أو المتصفح إن أمكن..."
            className="w-full resize-y rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold leading-8 text-[#31452c] outline-none focus:ring-2 focus:ring-[#3f5638]/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f7edda]"
          />
        </label>

        <label className="block">
          <FieldLabel>وسيلة تواصل اختيارية</FieldLabel>
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="بريد إلكتروني أو رقم واتساب اختياري"
            className="w-full rounded-2xl border border-[#d8c094]/45 bg-[#fbf7ef] px-4 py-3 font-bold text-[#31452c] outline-none focus:ring-2 focus:ring-[#3f5638]/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f7edda]"
          />
        </label>

        {status !== "idle" && (
          <div
            className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-black leading-7 ${
              status === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : status === "sending"
                  ? "bg-[#fff8e8] text-[#7b6431] dark:bg-white/10 dark:text-[#efdcb6]"
                  : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 size={18} />
            ) : status === "sending" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span>{statusText}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={submitReport}
            type="button"
            disabled={status === "sending"}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#3f5638] px-5 py-3 font-black text-white shadow-lg shadow-[#3f5638]/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            إرسال البلاغ
          </button>
        </div>
      </section>

    </div>
  );
}
