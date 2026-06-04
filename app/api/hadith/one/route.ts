import { NextRequest, NextResponse } from "next/server";
import { getHadeethById } from "@/lib/sources/hadeethEnc";
import { auditLog } from "@/lib/security/auditLog";

export async function GET(request: NextRequest) {
  try {
    const id = Number(request.nextUrl.searchParams.get("id"));
    await auditLog({ action: "read", target: "hadith.one", metadata: { provider: "hadeethenc", id } });
    const result = await getHadeethById({ id, language: "ar" });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
