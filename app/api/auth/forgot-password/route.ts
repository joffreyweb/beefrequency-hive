import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mailer";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hive.joffreydeleplanque.com";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Delete any existing tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    // Create new token with 1h expiration
    const reset = await prisma.passwordReset.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${BASE_URL}/reset-password/${reset.token}`;
    const firstName = user.name?.split(" ")[0] || "";
    const mailFrom = `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "info@joffreydeleplanque.com"}>`;

    await transporter.sendMail({
      from: mailFrom,
      to: user.email,
      subject: "R\u00e9initialisation de mot de passe",
      text: `Bonjour ${firstName},\n\nTu as demand\u00e9 \u00e0 r\u00e9initialiser ton mot de passe.\n\nClique ici pour choisir un nouveau mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi tu n\u2019as pas fait cette demande, ignore ce message.\n\nJoffrey`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FDFAF4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF4;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:520px;">
  <tr><td>
    <p style="font-size:18px;color:#2C1A0E;margin:0 0 16px 0;">Bonjour ${firstName},</p>
    <p style="font-size:16px;color:#2C1A0E;line-height:1.8;margin:0 0 24px 0;">
      Tu as demand&eacute; &agrave; r&eacute;initialiser ton mot de passe.
    </p>
    <p style="margin:0 0 24px 0;">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#B8821E;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.05em;border-radius:2px;">
        CHOISIR UN NOUVEAU MOT DE PASSE
      </a>
    </p>
    <p style="font-size:13px;color:#6B4423;margin:0 0 24px 0;">Ce lien expire dans 1 heure.</p>
    <p style="font-size:15px;color:#2C1A0E;margin:0;">Joffrey</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ ok: true }); // Silent fail
  }
}
