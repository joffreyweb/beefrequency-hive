import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse(unsubPage("Lien invalide", false), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (!subscriber) {
    return new NextResponse(unsubPage("Email non trouv\u00e9", false), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (subscriber.status === "unsubscribed") {
    return new NextResponse(unsubPage("D\u00e9j\u00e0 d\u00e9sinscrit", true), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await prisma.newsletterSubscriber.update({
    where: { email: normalizedEmail },
    data: {
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    },
  });

  return new NextResponse(unsubPage("D\u00e9sinscription confirm\u00e9e", true), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function unsubPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>D\u00e9sinscription — BeeFrequency</title>
<style>body{margin:0;padding:40px 16px;background:#FDFAF4;font-family:Georgia,serif;text-align:center;}
h1{color:#2C1A0E;font-size:24px;font-weight:300;margin-bottom:16px;}
p{color:#6B4423;font-size:16px;line-height:1.6;}
.check{color:${success ? "#4A5E44" : "#B8821E"};font-size:48px;margin-bottom:16px;}</style>
</head>
<body>
<div class="check">${success ? "\u2713" : "\u2717"}</div>
<h1>${message}</h1>
<p>${success ? "Vous ne recevrez plus nos emails." : "Une erreur est survenue."}</p>
<p style="margin-top:32px;font-size:12px;color:#B8821E;">BeeFrequency</p>
</body></html>`;
}
