import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?q=Rua+X,+São+Paulo
 * Proxy Nominatim (sem CORS no browser).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q é obrigatório" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${q}, Brasil`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "SquadioWeb/1.0 (courts-admin)",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ lat: null, lng: null }, { status: 200 });
    }
    const rows = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = rows[0];
    if (!first?.lat || !first?.lon) {
      return NextResponse.json({ lat: null, lng: null });
    }
    return NextResponse.json({
      lat: Number(first.lat),
      lng: Number(first.lon),
    });
  } catch {
    return NextResponse.json({ lat: null, lng: null });
  }
}
