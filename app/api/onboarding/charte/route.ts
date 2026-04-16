import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token invalide" }, { status: 401 });

    const { signature, signedAt, consent } = await request.json();

    // Build consent text archive for legal record
    const consentRecord = consent
      ? [
          `CONSENTEMENT SIGNÉ LE ${signedAt}`,
          consent.d1_conditions_generales ? "✓ Lu et approuvé — Conditions générales d'accompagnement" : "✗ Non accepté",
          consent.d2_nature_non_medicale ? "✓ Lu et approuvé — Nature non médicale" : "✗ Non accepté",
          consent.d3_pleine_conscience ? "✓ Lu et approuvé — Pleine conscience et responsabilité" : "✗ Non accepté",
          `Signature : ${signature}`,
        ].join("\n")
      : null;

    const updatedClient = await prisma.client.update({
      where: { userId: payload.userId },
      data: {
        charteSignee: true,
        charteSignature: signature,
        charteSignedAt: new Date(signedAt),
        ...(consentRecord
          ? {
              engagementText: consentRecord,
            }
          : {}),
      },
    });

    // Archive convention PDF to kDrive (fire-and-forget)
    import("@/lib/kdrive-archive")
      .then(({ archiveConventionToKDrive }) => archiveConventionToKDrive(updatedClient.id))
      .catch((err) => console.error("[charte] kDrive archive error:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
