import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const messages = await prisma.dayMessage.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (messages.length === 0) return NextResponse.json({ text: null });
    const index = Math.floor(Math.random() * messages.length);
    return NextResponse.json({ text: messages[index].text });
  } catch {
    return NextResponse.json({ text: null });
  }
}
