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
  const subject =
    language === "EN"
      ? "Your access to the Hive is ready"
      : "Votre accès à la Hive est prêt";

  const body =
    language === "EN"
      ? `Hello${firstName ? " " + firstName : ""},\n\nYour private space is ready.\n\nClick here to activate your access:\n${inviteUrl}\n\nThis link is valid for 365 days.\n\nJoffrey`
      : `Bonjour${firstName ? " " + firstName : ""},\n\nTon espace privé est prêt.\n\nClique ici pour activer ton accès :\n${inviteUrl}\n\nCe lien est valable 365 jours.\n\nJoffrey`;

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
    to,
    subject,
    text: body,
  });
}
