import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const url = request.nextUrl;
  const status = url.searchParams.get("status") || undefined;
  const temperature = url.searchParams.get("temperature") || undefined;
  const source = url.searchParams.get("source") || undefined;
  const tag = url.searchParams.get("tag") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const format = url.searchParams.get("format");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (temperature) where.temperature = temperature;
  if (source) where.source = source;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const prospects = await prisma.prospect.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  if (format === "csv") {
    const header = "email,firstName,lastName,company,role,source,status,temperature,score,lastContactAt,nextFollowUpAt\n";
    const rows = prospects.map((p) =>
      `"${p.email}","${p.firstName || ""}","${p.lastName || ""}","${p.company || ""}","${p.role || ""}","${p.source}","${p.status}","${p.temperature}","${p.score}","${p.lastContactAt?.toISOString() || ""}","${p.nextFollowUpAt?.toISOString() || ""}"`
    ).join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=prospects.csv",
      },
    });
  }

  return NextResponse.json({ prospects, total: prospects.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const prospect = await prisma.prospect.create({
    data: {
      email: body.email.toLowerCase().trim(),
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      phone: body.phone || null,
      company: body.company || null,
      role: body.role || null,
      source: body.source || "manual",
      sourceDetail: body.sourceDetail || null,
      referredBy: body.referredBy || null,
      status: body.status || "new",
      temperature: body.temperature || "cold",
      budget: body.budget || null,
      timeline: body.timeline || null,
      needs: body.needs || [],
      painPoints: body.painPoints || [],
      notes: body.notes || null,
      tags: body.tags || [],
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
    },
  });

  return NextResponse.json({ prospect });
}
