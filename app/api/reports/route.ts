import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const allowedKinds = new Set([
  "خطأ في القرآن",
  "مشكلة في التفسير",
  "مشكلة في الصوتيات",
  "مشكلة في الأذكار",
  "مشكلة في التصميم",
  "اقتراح تطوير",
  "أخرى",
]);

const allowedSections = new Set([
  "الرئيسية",
  "القرآن",
  "التفسير",
  "الصوتيات",
  "الأذكار",
  "الحديث",
  "الإعدادات",
  "أخرى",
]);

const allowedPriorities = new Set(["بسيطة", "متوسطة", "مهمة", "عاجلة"]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "تعذر إرسال البلاغ الآن." },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات البلاغ غير صحيحة." }, { status: 400 });
  }

  const kind = allowedKinds.has(body.kind) ? body.kind : "أخرى";
  const section = allowedSections.has(body.section) ? body.section : "أخرى";
  const priority = allowedPriorities.has(body.priority) ? body.priority : "متوسطة";
  const title = cleanText(body.title, 160);
  const details = cleanText(body.details, 4000);
  const contact = cleanText(body.contact, 180);
  const pageUrl = cleanText(body.pageUrl, 600);
  const deviceInfo = cleanText(body.deviceInfo, 1200);
  const reportText = cleanText(body.reportText, 6000);

  if (title.length < 3) {
    return NextResponse.json({ error: "اكتب عنوانًا مختصرًا للبلاغ." }, { status: 400 });
  }

  if (details.length < 10) {
    return NextResponse.json({ error: "اكتب وصفًا أوضح للمشكلة." }, { status: 400 });
  }

  const userAgent = cleanText(request.headers.get("user-agent"), 1200);
  const referer = cleanText(request.headers.get("referer"), 600);
  const forwardedFor = cleanText(request.headers.get("x-forwarded-for"), 220);

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("rifq_reports").insert({
    kind,
    section,
    priority,
    title,
    details,
    contact: contact || null,
    page_url: pageUrl || referer || null,
    device_info: deviceInfo || null,
    user_agent: userAgent || null,
    forwarded_for: forwardedFor || null,
    report_text: reportText || null,
    status: "new",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
