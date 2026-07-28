/**
 * kDrive Auto-Archivage — fire-and-forget uploads
 *
 * Fonctions appelées après les événements client (double sécurité app + kDrive) :
 * 1. archiveConventionToKDrive  — après signature convention   → Contrats/
 * 2. archiveVideoToKDrive       — après enregistrement vidéo    → Videos/
 * 3. archiveQuestionnaireToKDrive — après soumission questionnaire → Onboarding/
 * 4. archiveDocumentToKDrive    — après dépôt d'un document      → Documents/  (prise de sang, etc.)
 * 5. archiveClarityToKDrive     — à la publication du rapport    → Clarity/
 * 6. archiveSessionNoteToKDrive — à l'enregistrement d'une note  → Sessions/
 * 7. archiveRgpdToKDrive        — à l'acceptation du consentement → RGPD/
 */

import { prisma } from "@/lib/prisma";
import { isKDriveConfigured, uploadToKDrive, getClientSubfolder, createClientFolder, ensureClientSubfolder } from "@/lib/kdrive";
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

// ══════════════════════════════════════
// 4. DOCUMENT CLIENT (prise de sang, etc.) → kDrive/Documents/
// ══════════════════════════════════════

export async function archiveDocumentToKDrive(documentId: string): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const document = await prisma.clientDocument.findUnique({
      where: { id: documentId },
      select: { clientId: true, fileName: true, fileUrl: true, category: true, createdAt: true },
    });
    if (!document) return;

    const rootId = await ensureRootFolderId(document.clientId);
    if (!rootId) return;

    // Documents/ → puis un sous-dossier PAR CATÉGORIE (évite le fourre-tout).
    const documentsId = await ensureClientSubfolder(rootId, "Documents");
    if (!documentsId) return;

    const CATEGORY_FOLDERS: Record<string, string> = {
      ANALYSE: "Analyses",
      IDENTITE: "Identité",
      MEDICAL: "Médical",
      AUTRE: "Autre",
    };
    const catFolder = CATEGORY_FOLDERS[document.category] ?? "Autre";
    const folderId = await ensureClientSubfolder(documentsId, catFolder);
    if (!folderId) return;

    // Le fichier est sur le disque : fileUrl = /uploads/clients/{clientId}/{stored}
    const localPath = join(process.cwd(), document.fileUrl);
    const buffer = await readFile(localPath);

    const dateStr = new Date(document.createdAt).toISOString().split("T")[0];
    const safeName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${dateStr}_${safeName}`;

    const ok = await uploadToKDrive(folderId, fileName, buffer);
    if (ok) console.log(`[kDrive-archive] Document uploadé: Documents/${catFolder}/${fileName}`);
  } catch (error) {
    console.error("[kDrive-archive] Erreur document:", error);
  }
}

// ══════════════════════════════════════
// 5. CLARITY (rapport + réponses) → kDrive/Clarity/
// ══════════════════════════════════════

export async function archiveClarityToKDrive(clientId: string): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const sub = await prisma.claritySubmission.findUnique({
      where: { clientId },
      select: {
        answers: true,
        reportMd: true,
        publishedAt: true,
        submittedAt: true,
        client: { select: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!sub || (!sub.reportMd && !sub.answers)) return;

    const rootId = await ensureRootFolderId(clientId);
    if (!rootId) return;

    const folderId = await ensureClientSubfolder(rootId, "Clarity");
    if (!folderId) return;

    const dateRef = sub.publishedAt ?? sub.submittedAt ?? new Date();
    const dateStr = new Date(dateRef).toISOString().split("T")[0];
    const { CLARITY_MAPS, answerKey } = await import("@/lib/clarity/maps");
    const answers = (sub.answers as Record<string, string>) || {};

    const pdf = await generatePdfBuffer((doc) => {
      doc.fontSize(18).font("Helvetica-Bold").text("CLARITY — Synthèse & Réponses", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("BeeFrequency — Joffrey Deleplanque", { align: "center" });
      doc.text(`Client : ${sub.client.user.name} (${sub.client.user.email})`, { align: "center" });
      doc.moveDown(2);

      if (sub.reportMd) {
        doc.fontSize(13).font("Helvetica-Bold").text("Rapport de synthèse");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").text(sub.reportMd);
      }

      // Annexe — réponses brutes (archive INTERNE de Joffrey uniquement, jamais exposée au client)
      doc.addPage();
      doc.fontSize(13).font("Helvetica-Bold").text("Annexe — Réponses du client (usage interne)");
      doc.moveDown(0.5);
      CLARITY_MAPS.forEach((map, mapIdx) => {
        map.sections.forEach((sec, secIdx) => {
          sec.questions.forEach((q, qIdx) => {
            const a = (answers[answerKey(mapIdx, secIdx, qIdx)] || "").trim();
            if (!a) return;
            doc.fontSize(9).font("Helvetica-Bold").text(q.text.FR);
            doc.fontSize(9).font("Helvetica").text(a);
            doc.moveDown(0.4);
          });
        });
      });

      doc.moveDown(1);
      doc.fontSize(8).fillColor("#999").text(
        `Document généré automatiquement — BeeFrequency — ${new Date().toISOString()}`,
        { align: "center" },
      );
    });

    const fileName = `Clarity_${dateStr}.pdf`;
    const ok = await uploadToKDrive(folderId, fileName, pdf);
    if (ok) console.log(`[kDrive-archive] Clarity uploadé: ${fileName}`);
  } catch (error) {
    console.error("[kDrive-archive] Erreur Clarity:", error);
  }
}

// ══════════════════════════════════════
// 6. NOTE DE SÉANCE → kDrive/Sessions/
// ══════════════════════════════════════

export async function archiveSessionNoteToKDrive(sessionNoteId: string): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const note = await prisma.sessionNote.findUnique({
      where: { id: sessionNoteId },
      select: {
        content: true,
        createdAt: true,
        session: { select: { clientId: true } },
        appointment: { select: { clientId: true } },
      },
    });
    if (!note) return;

    const clientId = note.session?.clientId ?? note.appointment?.clientId;
    if (!clientId) return;

    const rootId = await ensureRootFolderId(clientId);
    if (!rootId) return;

    const folderId = await ensureClientSubfolder(rootId, "Sessions");
    if (!folderId) return;

    const dateStr = new Date(note.createdAt).toISOString().split("T")[0];
    const pdf = await generatePdfBuffer((doc) => {
      doc.fontSize(18).font("Helvetica-Bold").text("NOTE DE SÉANCE", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("BeeFrequency — Joffrey Deleplanque", { align: "center" });
      doc.text(`Date : ${new Date(note.createdAt).toLocaleDateString("fr-FR")}`, { align: "center" });
      doc.moveDown(2);
      doc.fontSize(10).font("Helvetica").text(note.content);
      doc.moveDown(2);
      doc.fontSize(8).fillColor("#999").text(
        `Document généré automatiquement — BeeFrequency — ${new Date().toISOString()}`,
        { align: "center" },
      );
    });

    // Nom stable par note (évite les doublons si la note est ré-enregistrée).
    const fileName = `Note_seance_${dateStr}_${sessionNoteId.slice(0, 6)}.pdf`;
    const ok = await uploadToKDrive(folderId, fileName, pdf);
    if (ok) console.log(`[kDrive-archive] Note de séance uploadée: ${fileName}`);
  } catch (error) {
    console.error("[kDrive-archive] Erreur note de séance:", error);
  }
}

// ══════════════════════════════════════
// 7. CONSENTEMENT RGPD → kDrive/RGPD/
// ══════════════════════════════════════

export async function archiveRgpdToKDrive(clientId: string): Promise<void> {
  if (!isKDriveConfigured()) return;

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        engagementAcceptedAt: true,
        charteSignedAt: true,
        engagementText: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!client) return;

    const acceptedAt = client.engagementAcceptedAt ?? client.charteSignedAt;
    if (!acceptedAt) return; // pas encore de consentement

    const rootId = await ensureRootFolderId(clientId);
    if (!rootId) return;

    const folderId = await ensureClientSubfolder(rootId, "RGPD");
    if (!folderId) return;

    const accepted = new Date(acceptedAt);
    const dateStr = accepted.toISOString().split("T")[0];
    const pdf = await generatePdfBuffer((doc) => {
      doc.fontSize(18).font("Helvetica-Bold").text("CONSENTEMENT & DONNÉES (RGPD)", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("BeeFrequency — Joffrey Deleplanque", { align: "center" });
      doc.moveDown(2);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Client : ${client.user.name} (${client.user.email})`);
      doc.text(
        `Consentement accepté le : ${accepted.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${accepted.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      );
      if (client.engagementText) {
        doc.moveDown(1);
        doc.fontSize(12).font("Helvetica-Bold").text("Déclaration archivée");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").text(client.engagementText);
      }
      doc.moveDown(2);
      doc.fontSize(8).fillColor("#999").text(
        `Preuve de consentement générée automatiquement — BeeFrequency — ${new Date().toISOString()}`,
        { align: "center" },
      );
    });

    const fileName = `Consentement_RGPD_${dateStr}.pdf`;
    const ok = await uploadToKDrive(folderId, fileName, pdf);
    if (ok) console.log(`[kDrive-archive] Consentement RGPD uploadé: ${fileName}`);
  } catch (error) {
    console.error("[kDrive-archive] Erreur RGPD:", error);
  }
}
