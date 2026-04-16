/**
 * kDrive Auto-Archivage — fire-and-forget uploads
 *
 * 3 fonctions appelées après les événements client :
 * 1. archiveConventionToKDrive — après signature convention
 * 2. archiveVideoToKDrive — après enregistrement vidéo seuil
 * 3. archiveQuestionnaireToKDrive — après soumission questionnaire
 */

import { prisma } from "@/lib/prisma";
import { isKDriveConfigured, uploadToKDrive, getClientSubfolder, createClientFolder } from "@/lib/kdrive";
import { readFile } from "fs/promises";
import { join } from "path";
import { t } from "@/lib/translations";

// ── PDF generation helper (pdfkit) ──

async function generatePdfBuffer(buildFn: (doc: InstanceType<typeof import("pdfkit")>) => void): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    buildFn(doc);
    doc.end();
  });
}

// ── Ensure we have the client's kDrive root folder ID ──

async function ensureRootFolderId(clientId: string): Promise<string | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { kdriveRootFolderId: true, user: { select: { name: true } } },
  });
  if (!client) return null;

  if (client.kdriveRootFolderId) return client.kdriveRootFolderId;

  // Create folder structure if missing
  const result = await createClientFolder(client.user.name || "Client", clientId);
  if (!result) return null;

  await prisma.client.update({
    where: { id: clientId },
    data: { kdriveRootFolderId: result.rootFolderId },
  });

  return result.rootFolderId;
}

// ══════════════════════════════════════
// 1. CONVENTION PDF → kDrive/Contrats/
// ══════════════════════════════════════

export async function archiveConventionToKDrive(clientId: string): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        charteSignature: true,
        charteSignedAt: true,
        engagementText: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!client || !client.charteSignedAt) return;

    const rootId = await ensureRootFolderId(clientId);
    if (!rootId) return;

    const contratsId = await getClientSubfolder(rootId, "Contrats");
    if (!contratsId) return;

    const charterText = t.charterFR;
    const signedAt = new Date(client.charteSignedAt);
    const dateStr = signedAt.toISOString().split("T")[0];

    const pdf = await generatePdfBuffer((doc) => {
      // Header
      doc.fontSize(18).font("Helvetica-Bold").text("CONVENTION & ENGAGEMENT", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("BeeFrequency — Joffrey Deleplanque", { align: "center" });
      doc.moveDown(2);

      // Charter text
      doc.fontSize(10).font("Helvetica");
      charterText.split("\n\n").forEach((paragraph) => {
        const isHeading = /^(\d+\.|Convention|Objet|---)/.test(paragraph.trim());
        if (isHeading) {
          doc.moveDown(0.5).font("Helvetica-Bold").text(paragraph.trim()).font("Helvetica");
        } else {
          doc.text(paragraph.trim());
        }
        doc.moveDown(0.5);
      });

      // Consent record
      if (client.engagementText) {
        doc.moveDown(1);
        doc.fontSize(12).font("Helvetica-Bold").text("DÉCLARATION & CONSENTEMENT");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").text(client.engagementText);
      }

      // Signature block
      doc.moveDown(2);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Signé par : ${client.charteSignature || client.user.name}`);
      doc.text(`Date : ${signedAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${signedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
      doc.text(`Email : ${client.user.email}`);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor("#999").text(
        `Document généré automatiquement — BeeFrequency — ${new Date().toISOString()}`,
        { align: "center" }
      );
    });

    const fileName = `Convention_${dateStr}.pdf`;
    const ok = await uploadToKDrive(contratsId, fileName, pdf);

    if (ok) {
      await prisma.client.update({
        where: { id: clientId },
        data: { kdriveConventionUrl: `/Contrats/${fileName}` },
      });
      console.log(`[kDrive-archive] Convention uploadée: ${fileName}`);
    }
  } catch (error) {
    console.error("[kDrive-archive] Erreur convention:", error);
  }
}

// ══════════════════════════════════════
// 2. VIDÉO SEUIL → kDrive/Videos/
// ══════════════════════════════════════

export async function archiveVideoToKDrive(
  clientId: string,
  seuil: string,
  localPath: string
): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const rootId = await ensureRootFolderId(clientId);
    if (!rootId) return;

    const videosId = await getClientSubfolder(rootId, "Videos");
    if (!videosId) return;

    const buffer = await readFile(localPath);
    const fileName = `seuil-${seuil}.webm`;
    const ok = await uploadToKDrive(videosId, fileName, buffer);

    if (ok) {
      console.log(`[kDrive-archive] Vidéo uploadée: ${fileName}`);
    }
  } catch (error) {
    console.error("[kDrive-archive] Erreur vidéo:", error);
  }
}

// ══════════════════════════════════════
// 3. QUESTIONNAIRE PDF → kDrive/Onboarding/
// ══════════════════════════════════════

export async function archiveQuestionnaireToKDrive(clientId: string): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        user: { select: { name: true, email: true } },
        questionnaireEntry: { select: { responses: true, submittedAt: true } },
      },
    });
    if (!client?.questionnaireEntry?.responses || !client.questionnaireEntry.submittedAt) return;

    const rootId = await ensureRootFolderId(clientId);
    if (!rootId) return;

    const onboardingId = await getClientSubfolder(rootId, "Onboarding");
    if (!onboardingId) return;

    const responses = client.questionnaireEntry.responses as Record<string, Record<string, string>>;
    const submittedAt = new Date(client.questionnaireEntry.submittedAt);
    const dateStr = submittedAt.toISOString().split("T")[0];

    // Import questionnaire section metadata
    const { SECTIONS } = await import("@/lib/questionnaire-data");

    const pdf = await generatePdfBuffer((doc) => {
      // Header
      doc.fontSize(18).font("Helvetica-Bold").text("QUESTIONNAIRE D'ENTRÉE", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("BeeFrequency — Joffrey Deleplanque", { align: "center" });
      doc.moveDown(0.5);
      doc.text(`Client : ${client.user.name} (${client.user.email})`, { align: "center" });
      doc.text(`Soumis le : ${submittedAt.toLocaleDateString("fr-FR")}`, { align: "center" });
      doc.moveDown(2);

      // Sections
      for (const section of SECTIONS) {
        const sectionAnswers = responses[section.id];
        if (!sectionAnswers) continue;

        doc.fontSize(12).font("Helvetica-Bold").text(`${section.icon} ${section.title}`);
        doc.moveDown(0.5);

        for (const question of section.questions) {
          const answer = sectionAnswers[question.id];
          if (!answer) continue;

          doc.fontSize(9).font("Helvetica-Bold").text(question.text);

          // Format answer
          let displayAnswer = answer;
          if (question.type === "checkbox") {
            try {
              const checked = JSON.parse(answer) as string[];
              const labels = checked.map((val) => {
                const opt = question.options?.find((o) => o.value === val);
                return opt ? `✓ ${opt.label}` : `✓ ${val}`;
              });
              displayAnswer = labels.join("\n");
            } catch {
              displayAnswer = answer;
            }
          } else if (question.type === "mcq") {
            const opt = question.options?.find((o) => o.value === answer);
            displayAnswer = opt ? opt.label : answer;
          }

          doc.fontSize(9).font("Helvetica").text(displayAnswer);
          doc.moveDown(0.5);
        }

        doc.moveDown(1);
      }

      // Footer
      doc.fontSize(8).fillColor("#999").text(
        `Document généré automatiquement — BeeFrequency — ${new Date().toISOString()}`,
        { align: "center" }
      );
    });

    const fileName = `Questionnaire_${dateStr}.pdf`;
    const ok = await uploadToKDrive(onboardingId, fileName, pdf);

    if (ok) {
      await prisma.client.update({
        where: { id: clientId },
        data: { kdriveQuestionnaireUrl: `/Onboarding/${fileName}` },
      });
      console.log(`[kDrive-archive] Questionnaire uploadé: ${fileName}`);
    }
  } catch (error) {
    console.error("[kDrive-archive] Erreur questionnaire:", error);
  }
}
