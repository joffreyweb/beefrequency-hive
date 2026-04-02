import nodemailer from "nodemailer";

const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

// Diagnostic log au premier chargement
console.log("[mailer] SMTP config:", {
  host: process.env.SMTP_HOST || "(missing)",
  port: process.env.SMTP_PORT || "465",
  secure: process.env.SMTP_SECURE || "(missing)",
  user: process.env.SMTP_USER || "(missing)",
  passExists: !!smtpPass,
  passVar: process.env.SMTP_PASS ? "SMTP_PASS" : process.env.SMTP_PASSWORD ? "SMTP_PASSWORD" : "(none)",
});

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
});

export async function sendInvitationEmail({
  to,
  firstName,
  inviteUrl,
  language = "FR",
}: {
  to: string;
  firstName?: string;
  inviteUrl: string;
  language?: "FR" | "EN";
}) {
  const isFR = language === "FR";

  const subject = isFR
    ? "Votre accès à la Hive est prêt"
    : "Your access to the Hive is ready";

  const greeting = isFR
    ? `Bonjour${firstName ? " " + firstName : ""}`
    : `Hello${firstName ? " " + firstName : ""}`;

  const textBody = isFR
    ? `${greeting},\n\nTon espace privé est prêt.\n\nClique ici pour activer ton accès :\n${inviteUrl}\n\nCe lien est valable 365 jours.\n\nJoffrey`
    : `${greeting},\n\nYour private space is ready.\n\nClick here to activate your access:\n${inviteUrl}\n\nThis link is valid for 365 days.\n\nJoffrey`;

  const htmlBody = buildInvitationHtml({ greeting, inviteUrl, isFR });

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

function buildInvitationHtml({
  greeting,
  inviteUrl,
  isFR,
}: {
  greeting: string;
  inviteUrl: string;
  isFR: boolean;
}) {
  const intro = isFR ? "Ton espace privé est prêt." : "Your private space is ready.";
  const welcomeBlock = isFR
    ? `<p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;line-height:1.8;margin:0 0 24px 0;">
Bienvenue dans la Hive.<br>
Cet espace t'appartient.<br>
C'est ici que commence vraiment ton voyage —<br>
à ton rythme, en toute confiance,<br>
accompagné à chaque étape.
</p>`
    : `<p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;line-height:1.8;margin:0 0 24px 0;">
Welcome to the Hive.<br>
This space is yours.<br>
This is where your journey truly begins —<br>
at your pace, in full trust,<br>
accompanied at every step.
</p>`;
  const ctaLabel = isFR ? "Accéder à mon espace" : "Access my space";
  const linkNote = isFR
    ? "Ce lien est valable 365 jours."
    : "This link is valid for 365 days.";

  const pwaBlock = isFR
    ? `<div style="margin-top:32px;padding:24px;background:#F0E8D5;border-radius:8px;border-left:3px solid #B8821E;">
  <p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;margin:0 0 16px 0;font-weight:bold;">
    📱 Installe l'application sur ton téléphone
  </p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B4423;margin:0 0 16px 0;">
    Pour un accès direct depuis ton écran d'accueil, sans passer par un navigateur :
  </p>
  <div style="margin-bottom:12px;">
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🍎 iPhone (Safari uniquement)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Ouvre ce lien dans <strong>Safari</strong><br>
      2. Appuie sur l'icône <strong>Partager</strong> (carré avec flèche)<br>
      3. Choisis <strong>« Sur l'écran d'accueil »</strong><br>
      4. Appuie sur <strong>Ajouter</strong> ✓
    </p>
  </div>
  <div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🤖 Android (Chrome ou Brave)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Ouvre ce lien dans <strong>Chrome</strong> ou <strong>Brave</strong><br>
      2. Appuie sur les <strong>3 points</strong> en haut à droite<br>
      3. Choisis <strong>« Ajouter à l'écran d'accueil »</strong> ✓
    </p>
  </div>
</div>`
    : `<div style="margin-top:32px;padding:24px;background:#F0E8D5;border-radius:8px;border-left:3px solid #B8821E;">
  <p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;margin:0 0 16px 0;font-weight:bold;">
    📱 Install the app on your phone
  </p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B4423;margin:0 0 16px 0;">
    For direct access from your home screen, without opening a browser:
  </p>
  <div style="margin-bottom:12px;">
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🍎 iPhone (Safari only)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Open this link in <strong>Safari</strong><br>
      2. Tap the <strong>Share</strong> icon (square with arrow)<br>
      3. Choose <strong>"Add to Home Screen"</strong><br>
      4. Tap <strong>Add</strong> ✓
    </p>
  </div>
  <div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🤖 Android (Chrome or Brave)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Open this link in <strong>Chrome</strong> or <strong>Brave</strong><br>
      2. Tap the <strong>3 dots</strong> menu<br>
      3. Choose <strong>"Add to Home Screen"</strong> ✓
    </p>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="${isFR ? "fr" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDFAF4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF4;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:520px;">

  <tr><td style="padding-bottom:24px;">
    <p style="font-family:Georgia,serif;font-size:18px;color:#2C1A0E;margin:0 0 16px 0;">${greeting},</p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;margin:0 0 24px 0;">${intro}</p>
    ${welcomeBlock}
  </td></tr>

  <tr><td align="center" style="padding-bottom:24px;">
    <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#B8821E;color:#FDFAF4;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;border-radius:6px;">${ctaLabel}</a>
  </td></tr>

  <tr><td>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0 0 8px 0;">${linkNote}</p>
    ${pwaBlock}
  </td></tr>

  <tr><td style="padding-top:32px;">
    <p style="font-family:Georgia,serif;font-size:15px;color:#2C1A0E;margin:0;">Joffrey</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
