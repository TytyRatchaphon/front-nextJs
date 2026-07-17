import { NextRequest, NextResponse } from "next/server";

import { buildTenorApiUrl, normalizeTenorResults } from "@/features/liveChat/gifPickerModel";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const apiKey = process.env.TENOR_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { message: "ยังไม่ได้ตั้งค่า TENOR_API_KEY" },
      { status: 503 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length === 1) return NextResponse.json({ items: [] });

  try {
    const response = await fetch(buildTenorApiUrl({ apiKey, query }), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { message: "ค้นหา GIF ไม่สำเร็จ" },
        { status: response.status },
      );
    }
    return NextResponse.json({ items: normalizeTenorResults(await response.json()) });
  } catch {
    return NextResponse.json({ message: "เชื่อมต่อคลัง GIF ไม่สำเร็จ" }, { status: 502 });
  }
}
