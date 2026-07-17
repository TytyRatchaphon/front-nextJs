import { NextRequest, NextResponse } from "next/server";

import { isAllowedTenorMediaUrl } from "@/features/liveChat/gifPickerModel";

const MAX_GIF_BYTES = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const mediaUrl = request.nextUrl.searchParams.get("url") ?? "";
  if (!isAllowedTenorMediaUrl(mediaUrl)) {
    return NextResponse.json({ message: "GIF URL ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const response = await fetch(mediaUrl, { headers: { Accept: "image/gif" } });
    if (!response.ok) {
      return NextResponse.json({ message: "ดาวน์โหลด GIF ไม่สำเร็จ" }, { status: 502 });
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("image/gif")) {
      return NextResponse.json({ message: "ไฟล์ที่ได้รับไม่ใช่ GIF" }, { status: 415 });
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_GIF_BYTES) {
      return NextResponse.json({ message: "GIF ต้องมีขนาดไม่เกิน 5 MB" }, { status: 413 });
    }

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "ดาวน์โหลด GIF ไม่สำเร็จ" }, { status: 502 });
  }
}
