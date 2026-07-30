import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/import — Import Option A (déterministe, souverain, idempotent).
// Dépose un programme JSON (format §5 du CDC) → crée/actualise un Project + ses items ordonnés.
// Idempotent : clé Project = programme.nom · clé item = "nom#ordre".
// Re-déposer le même JSON ne duplique rien et ne casse pas la progression (statut préservé à l'update).

interface ImportElement {
  ordre: number;
  titre: string;
  type?: string; // tache | post_instagram | rdv | rappel
  format?: string; // carte | reel
  fichier?: string;
  legende?: string;
  hashtags?: string;
  epingle?: boolean;
  statut?: string; // a_faire | fait
}
interface ImportProgramme {
  programme: { nom: string; type?: string; cadence?: string; couleur?: string };
  elements: ImportElement[];
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  let raw: unknown;
  try {
    const body = await request.json();
    // Accepte soit le JSON direct, soit { json: "<texte>" }.
    if (body && typeof body === "object" && "programme" in body) raw = body;
    else if (body && typeof body.json === "string") raw = JSON.parse(body.json);
    else raw = body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const data = raw as ImportProgramme;
  const nom = data?.programme?.nom?.trim();
  if (!nom || !Array.isArray(data.elements)) {
    return NextResponse.json(
      { error: "Format attendu : { programme: { nom }, elements: [...] }" },
      { status: 400 },
    );
  }

  // 1) Project (upsert par importKey = nom)
  const project = await prisma.project.upsert({
    where: { importKey: nom },
    create: {
      name: nom,
      color: data.programme.couleur?.trim() || "#B8821E",
      type: data.programme.type?.trim() || "programme",
      importKey: nom,
    },
    update: {
      name: nom,
      color: data.programme.couleur?.trim() || "#B8821E",
      type: data.programme.type?.trim() || "programme",
    },
  });

  let posts = 0;
  let tasks = 0;

  // 2) Éléments, dans l'ordre
  const sorted = [...data.elements].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  for (const el of sorted) {
    const ordre = Number(el.ordre ?? 0);
    const titre = (el.titre ?? "").trim();
    if (!titre) continue;
    const key = `${nom}#${ordre}`;
    const type = (el.type ?? "tache").trim();

    if (type === "post_instagram") {
      const status: "TODO" | "POSTED" = el.statut === "fait" ? "POSTED" : "TODO";
      await prisma.contentPost.upsert({
        where: { importKey: key },
        create: {
          importKey: key,
          order: ordre,
          title: titre,
          caption: el.legende?.trim() || null,
          hashtags: el.hashtags?.trim() || null,
          mediaRef: el.fichier?.trim() || null,
          format: el.format?.trim() || null,
          pinned: !!el.epingle,
          status,
          projectId: project.id,
        },
        // Update : on ne touche PAS au statut (préserve la progression de Joffrey).
        update: {
          order: ordre,
          title: titre,
          caption: el.legende?.trim() || null,
          hashtags: el.hashtags?.trim() || null,
          mediaRef: el.fichier?.trim() || null,
          format: el.format?.trim() || null,
          pinned: !!el.epingle,
          projectId: project.id,
        },
      });
      posts++;
    } else {
      const status: "INBOX" | "TODAY" | "WEEK" | "DONE" | "SNOOZED" =
        el.statut === "fait" ? "DONE" : "WEEK";
      const existingTask = await prisma.task.findFirst({ where: { importKey: key } });
      if (existingTask) {
        // Update : on préserve le statut courant (progression).
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            title: titre,
            order: ordre,
            notes: el.legende?.trim() || null,
            projectId: project.id,
          },
        });
      } else {
        await prisma.task.create({
          data: {
            importKey: key,
            title: titre,
            status,
            order: ordre,
            origin: "import",
            notes: el.legende?.trim() || null,
            projectId: project.id,
            completed: el.statut === "fait",
            doneAt: el.statut === "fait" ? new Date() : null,
          },
        });
      }
      tasks++;
    }
  }

  return NextResponse.json({
    ok: true,
    project: { id: project.id, name: project.name },
    posts,
    tasks,
    total: posts + tasks,
  });
}
