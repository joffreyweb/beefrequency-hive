import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { listFolder, getKDriveStartFolder, isKDriveConfigured } from "@/lib/kdrive";

// GET /api/admin/kdrive?folderId=... — liste un dossier kDrive (admin-only).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  if (!isKDriveConfigured()) {
    return NextResponse.json({ configured: false, items: [], folderId: null });
  }

  const folderId = request.nextUrl.searchParams.get("folderId") || (await getKDriveStartFolder());
  try {
    const items = await listFolder(folderId);
    return NextResponse.json({ configured: true, folderId, items });
  } catch {
    return NextResponse.json({ configured: true, folderId, items: [], error: "Lecture kDrive impossible" });
  }
}
