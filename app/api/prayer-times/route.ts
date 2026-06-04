import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/security/auditLog";
import { getPrayerLocation } from "@/lib/prayer/prayerLocations";
import { calculateLocalPrayerTimes, calculatePrayerTimesForLocation, getPrayerMethodForCountry } from "@/lib/prayer/localPrayerTimes";

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city") || "Cairo";
    const country = request.nextUrl.searchParams.get("country") || "Egypt";
    const methodParam = request.nextUrl.searchParams.get("method");
    const latitudeParam = request.nextUrl.searchParams.get("latitude");
    const longitudeParam = request.nextUrl.searchParams.get("longitude");
    const timeZone = request.nextUrl.searchParams.get("timeZone") || "UTC";
    const method = methodParam ? Number(methodParam) : getPrayerMethodForCountry(country);
    const latitude = latitudeParam ? Number(latitudeParam) : undefined;
    const longitude = longitudeParam ? Number(longitudeParam) : undefined;

    if (latitude !== undefined && longitude !== undefined) {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return NextResponse.json({ error: "Invalid latitude or longitude" }, { status: 400 });
      }

      await auditLog({
        action: "read",
        target: "prayer-times",
        metadata: { latitude, longitude, method, source: "local-geolocation" }
      });

      return NextResponse.json(calculateLocalPrayerTimes({ latitude, longitude, method, timeZone }));
    }

    const location = getPrayerLocation(country, city);
    if (!location) {
      return NextResponse.json({ error: "Location is not available" }, { status: 404 });
    }

    await auditLog({
      action: "read",
      target: "prayer-times",
      metadata: { city, country, method, source: "local-city" }
    });

    return NextResponse.json(calculatePrayerTimesForLocation(location, method));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
