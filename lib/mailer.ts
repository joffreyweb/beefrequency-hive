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

const mailFrom = () =>
  `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`;

// ═══════════════════════════════════════
// BLOC PWA réutilisable (iPhone + Android)
// ═══════════════════════════════════════

function buildPwaBlock(isFR: boolean): string {
  const safariWarning = isFR
    ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#B8821E;margin:0 0 12px 0;font-weight:bold;">
⚠️ Tu lis cet email depuis Gmail ou une autre app ? Ouvre d'abord Safari, colle ce lien : <a href="https://hive.joffreydeleplanque.com" style="color:#B8821E;">hive.joffreydeleplanque.com</a> — puis suis les étapes ci-dessous.
</p>`
    : `<p style="font-family:Arial,sans-serif;font-size:12px;color:#B8821E;margin:0 0 12px 0;font-weight:bold;">
⚠️ Reading this from Gmail or another app? Open Safari first, paste this link: <a href="https://hive.joffreydeleplanque.com" style="color:#B8821E;">hive.joffreydeleplanque.com</a> — then follow the steps below.
</p>`;

  const title = isFR
    ? "📱 Installe l'application sur ton téléphone"
    : "📱 Install the app on your phone";
  const subtitle = isFR
    ? "Pour un accès direct depuis ton écran d'accueil, sans passer par un navigateur :"
    : "For direct access from your home screen, without opening a browser:";

  const iphone = isFR
    ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🍎 iPhone (Safari uniquement)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Ouvre ce lien dans <strong>Safari</strong><br>
      2. Appuie sur l'icône <strong>Partager</strong> (carré avec flèche)<br>
      3. Choisis <strong>« Sur l'écran d'accueil »</strong><br>
      4. Appuie sur <strong>Ajouter</strong> ✓
    </p>`
    : `<p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🍎 iPhone (Safari only)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Open this link in <strong>Safari</strong><br>
      2. Tap the <strong>Share</strong> icon (square with arrow)<br>
      3. Choose <strong>"Add to Home Screen"</strong><br>
      4. Tap <strong>Add</strong> ✓
    </p>`;

  const android = isFR
    ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🤖 Android (Chrome ou Brave)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Ouvre ce lien dans <strong>Chrome</strong> ou <strong>Brave</strong><br>
      2. Appuie sur les <strong>3 points</strong> en haut à droite<br>
      3. Choisis <strong>« Ajouter à l'écran d'accueil »</strong> ✓
    </p>`
    : `<p style="font-family:Arial,sans-serif;font-size:13px;color:#2C1A0E;margin:0 0 6px 0;font-weight:bold;">
      🤖 Android (Chrome or Brave)
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B4423;margin:0;line-height:1.6;">
      1. Open this link in <strong>Chrome</strong> or <strong>Brave</strong><br>
      2. Tap the <strong>3 dots</strong> menu<br>
      3. Choose <strong>"Add to Home Screen"</strong> ✓
    </p>`;

  return `<div style="margin-top:32px;padding:24px;background:#F0E8D5;border-radius:8px;border-left:3px solid #B8821E;">
  ${safariWarning}
  <p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;margin:0 0 16px 0;font-weight:bold;">
    ${title}
  </p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B4423;margin:0 0 16px 0;">
    ${subtitle}
  </p>
  <div style="margin-bottom:12px;">
    ${iphone}
  </div>
  <div>
    ${android}
  </div>
</div>`;
}

// ═══════════════════════════════════════
// Enveloppe HTML commune (fond crème BeeFrequency)
// ═══════════════════════════════════════

function wrapEmailHtml(isFR: boolean, innerContent: string): string {
  return `<!DOCTYPE html>
<html lang="${isFR ? "fr" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDFAF4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF4;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:520px;">
${innerContent}
  <tr><td style="padding-top:32px;">
    <p style="font-family:Georgia,serif;font-size:15px;color:#2C1A0E;margin:0;">Joffrey</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ═══════════════════════════════════════
// EMAIL 1 — Invitation (bienvenue + bouton)
// ═══════════════════════════════════════

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

  const innerContent = `
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
  </td></tr>`;

  const htmlBody = wrapEmailHtml(isFR, innerContent);

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

// ═══════════════════════════════════════
// EMAIL 2 — PWA (post-onboarding)
// ═══════════════════════════════════════

export async function sendPWAEmail({
  to,
  firstName,
  language = "FR",
}: {
  to: string;
  firstName?: string;
  language?: "FR" | "EN";
}) {
  const isFR = language === "FR";

  const subject = isFR
    ? "📱 Installe la Hive sur ton téléphone"
    : "📱 Install the Hive on your phone";

  const greeting = isFR
    ? `Bonjour${firstName ? " " + firstName : ""}`
    : `Hello${firstName ? " " + firstName : ""}`;

  const bodyBlock = isFR
    ? `<p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;line-height:1.8;margin:0 0 24px 0;">
Ton espace est actif. 🐝<br><br>
Savais-tu que tu peux installer la Hive<br>
directement sur ton téléphone — comme une vraie app ?<br>
Un simple geste, et tu y accèdes en une touche,<br>
sans ouvrir de navigateur.
</p>`
    : `<p style="font-family:Georgia,serif;font-size:16px;color:#2C1A0E;line-height:1.8;margin:0 0 24px 0;">
Your space is active. 🐝<br><br>
Did you know you can install the Hive<br>
directly on your phone — like a real app?<br>
One simple gesture, and you access it in one tap,<br>
without opening a browser.
</p>`;

  const textBody = isFR
    ? `${greeting},\n\nTon espace est actif. 🐝\n\nSavais-tu que tu peux installer la Hive directement sur ton téléphone — comme une vraie app ?\nUn simple geste, et tu y accèdes en une touche, sans ouvrir de navigateur.\n\nRendez-vous sur https://hive.joffreydeleplanque.com dans Safari (iPhone) ou Chrome (Android) pour l'installer.\n\nJoffrey`
    : `${greeting},\n\nYour space is active. 🐝\n\nDid you know you can install the Hive directly on your phone — like a real app?\nOne simple gesture, and you access it in one tap, without opening a browser.\n\nGo to https://hive.joffreydeleplanque.com in Safari (iPhone) or Chrome (Android) to install it.\n\nJoffrey`;

  const innerContent = `
  <tr><td style="padding-bottom:24px;">
    <p style="font-family:Georgia,serif;font-size:18px;color:#2C1A0E;margin:0 0 16px 0;">${greeting},</p>
    ${bodyBlock}
  </td></tr>

  <tr><td>
    ${buildPwaBlock(isFR)}
  </td></tr>`;

  const htmlBody = wrapEmailHtml(isFR, innerContent);

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}
