import { prisma } from "@/lib/prisma";
import { renderMarkdownToHtml } from "@/lib/clarity/markdown";

export const dynamic = "force-dynamic";

// Page publique du rapport Clarity — accès par reportToken uniquement.
// CONFIDENTIALITÉ : ne lit QUE status + reportMd. Les réponses (answers) ne sont
// jamais requêtées ni exposées ici.
export default async function ClarityReportPage({
  params,
}: {
  params: Promise<{ reportToken: string }>;
}) {
  const { reportToken } = await params;

  const sub = await prisma.claritySubmission.findUnique({
    where: { reportToken },
    select: { status: true, reportMd: true },
  });

  const published = !!sub && sub.status === "PUBLISHED" && !!sub.reportMd && sub.reportMd.trim().length > 0;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-svh bg-creme-sacree text-brun-chaud">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-center mb-8">
          <p className="font-caps text-xs uppercase tracking-[0.3em] text-or-sacre">Clarity by Beefrequency</p>
        </div>
        {children}
        <div className="text-center mt-12 pt-6 border-t border-or-pale/40">
          <p className="font-display text-base text-brun-mid">Joffrey</p>
        </div>
      </div>
    </div>
  );

  if (!sub) {
    return (
      <Shell>
        <div className="text-center py-16">
          <p className="font-display text-xl text-brun-chaud mb-2">Lien introuvable</p>
          <p className="font-ui text-sm text-brun-mid/70">Ce lien n'est pas valide. Vérifie l'adresse, ou reviens vers Joffrey.</p>
        </div>
      </Shell>
    );
  }

  if (!published) {
    return (
      <Shell>
        <div className="text-center py-16">
          <p className="font-display text-xl text-brun-chaud mb-2">Ton rapport se prépare</p>
          <p className="font-ui text-sm text-brun-mid/70">
            Ta synthèse est en cours de préparation. Reviens sur ce lien un peu plus tard — elle apparaîtra ici dès qu'elle est prête.
          </p>
        </div>
      </Shell>
    );
  }

  const html = renderMarkdownToHtml(sub.reportMd as string);

  return (
    <Shell>
      <article
        className="clarity-report font-ui text-[15px] leading-relaxed text-brun-chaud
                   [&>h2]:font-display [&>h2]:text-xl [&>h2]:text-or-sacre [&>h2]:mt-8 [&>h2]:mb-2
                   [&>h3]:font-display [&>h3]:text-lg [&>h3]:text-brun-chaud [&>h3]:mt-6 [&>h3]:mb-1
                   [&>h4]:font-caps [&>h4]:text-xs [&>h4]:uppercase [&>h4]:tracking-wider [&>h4]:text-brun-mid [&>h4]:mt-5
                   [&>p]:my-3 [&>ul]:my-3 [&>ul]:pl-5 [&>ul]:list-disc [&>li]:my-1
                   [&_strong]:text-brun-chaud [&_strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Shell>
  );
}
