import { NextResponse } from "next/server";
import { countryCities } from "@/lib/sources/countriesCities";

export async function GET() {
  return NextResponse.json({ data: countryCities });
}
