import { NextResponse } from "next/server";
import { auditLog } from "@/lib/security/auditLog";

const ALADHAN_BASE_URL = process.env.ALADHAN_BASE_URL || "https://api.aladhan.com/v1";

function todayDDMMYYYY() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function GET() {
  try {
    const date = todayDDMMYYYY();
    await auditLog({ action: "read", target: "hijri.today", metadata: { date } });

    const url = `${ALADHAN_BASE_URL}/gToH/${date}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 }
    });

    if (!res.ok) throw new Error(`Hijri date request failed: ${res.status}`);

    const data = await res.json();

    return NextResponse.json({ data: data?.data || data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
