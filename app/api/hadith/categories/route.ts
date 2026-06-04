import { NextResponse } from "next/server";
import { getHadeethCategories } from "@/lib/sources/hadeethEnc";
import { auditLog } from "@/lib/security/auditLog";

export async function GET() {
  try {
    await auditLog({ action: "read", target: "hadith.categories", metadata: { provider: "hadeethenc" } });
    const result = await getHadeethCategories("ar");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
