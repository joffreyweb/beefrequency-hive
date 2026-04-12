import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const url = request.nextUrl;
  const status = url.searchParams.get("status") || undefined;
  const source = url.searchParams.get("source") || undefined;
  const tag = url.searchParams.get("tag") || undefined;
  const segment = url.searchParams.get("segment") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const format = url.searchParams.get("format"); // "csv" for export

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (source) where.source = source;
  if (tag) where.tags = { has: tag };
  if (segment) where.segments = { has: segment };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    const header = "email,firstName,lastName,source,status,tags,segments,subscribedAt\n";
    const rows = subscribers.map((s) =>
      `"${s.email}","${s.firstName || ""}","${s.lastName || ""}","${s.source}","${s.status}","${s.tags.join(";")}","${s.segments.join(";")}","${s.subscribedAt.toISOString()}"`
    ).join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=newsletter-subscribers.csv",
      },
    });
  }

  return NextResponse.json({ subscribers, total: subscribers.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { email, firstName, lastName, source, tags, segments } = body;

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email: email.toLowerCase().trim(),
      firstName: firstName || null,
      lastName: lastName || null,
      source: source || "manual",
      tags: tags || [],
      segments: segments || [],
    },
  });

  return NextResponse.json({ subscriber });
}
