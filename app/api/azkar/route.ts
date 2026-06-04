import { NextResponse } from "next/server";
import { getAzkarFromApprovedJson } from "@/lib/sources/azkarSource";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

export async function GET() {
  try {
    await auditLog({ action: "read", target: "azkar" });
    const result = await getAzkarFromApprovedJson();
    return NextResponse.json(result, { headers: cacheHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
