import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/clients/[clientId]/cartes-status — Check if cartes generation is done
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      cartesGeneratedAt: true,
      hdFullData: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Check if hdFullData contains an error
  const hdData = client.hdFullData as any;
  if (hdData?.error && !client.cartesGeneratedAt) {
    return NextResponse.json({ generated: false, error: hdData.error });
  }

  return NextResponse.json({
    generated: !!client.cartesGeneratedAt,
    generatedAt: client.cartesGeneratedAt,
  });
}
