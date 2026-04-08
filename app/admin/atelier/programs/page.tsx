"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProgramModule {
  order: number;
  module: { name: string; nameFr: string; duration: number };
}

interface Program {
  id: string;
  name: string;
  nameFr: string;
  description: string | null;
  modules: ProgramModule[];
  _count: { clientPrograms: number };
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-400",
  cycle: "bg-or-sacre",
  break: "bg-foret/60",
  protocol30: "bg-ambre-vif",
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    fetch("/api/admin/programs").then((r) => r.json()).then((d) => setPrograms(d.programs || []));
  }, []);

  return (
    <div>
      <Link href="/admin/dashboard" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Cockpit
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brun-chaud">Programmes</h1>
      </div>

      <div className="space-y-4">
        {programs.map((prog) => {
          const totalDays = prog.modules.reduce((acc, m) => acc + m.module.duration, 0);
          return (
            <Link
              key={prog.id}
              href={`/admin/atelier/programs/${prog.id}`}
              className="block bg-cire-chaude border border-or-pale rounded-[10px] p-5 hover:border-or-sacre transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-display text-lg text-brun-chaud group-hover:text-or-sacre transition-colors">{prog.nameFr}</h3>
                  <p className="font-ui text-sm text-brun-mid">{totalDays} jours · {prog.modules.length} modules</p>
                </div>
                {prog._count.clientPrograms > 0 && (
                  <span className="text-[10px] font-ui text-brun-mid/50">{prog._count.clientPrograms} client(s)</span>
                )}
              </div>
              {prog.description && <p className="text-xs font-ui text-brun-mid/60 mb-3">{prog.description}</p>}

              {/* Timeline */}
              <div className="flex rounded-full overflow-hidden h-3">
                {prog.modules.map((pm, i) => (
                  <div
                    key={i}
                    className={`${MODULE_COLORS[pm.module.name] || "bg-brun-mid/20"} relative group/bar`}
                    style={{ flex: pm.module.duration }}
                    title={`${pm.module.nameFr} (${pm.module.duration}j)`}
                  />
                ))}
              </div>
              <div className="flex mt-1.5 text-[9px] font-ui text-brun-mid/40">
                {prog.modules.map((pm, i) => (
                  <span key={i} style={{ flex: pm.module.duration }} className="truncate">{pm.module.nameFr}</span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
