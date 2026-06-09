"use client";

import { Tender, SourceMeta } from "@/lib/types";

interface StatsBarProps {
  tenders: Tender[];
  lastUpdated: string | null;
  isLoading: boolean;
  sourceMeta: SourceMeta[];
}

export default function StatsBar({ tenders, lastUpdated, isLoading, sourceMeta }: StatsBarProps) {
  const high = tenders.filter((t) => t.compatibilita === "Alta compatibilità").length;
  const medium = tenders.filter((t) => t.compatibilita === "Media compatibilità").length;
  const other = tenders.filter((t) => t.compatibilita === "Da valutare").length;

  const realSources = sourceMeta.filter((s) => s.isReal);
  const exampleSources = sourceMeta.filter((s) => !s.isReal && !s.error);
  const failedSources = sourceMeta.filter((s) => !s.isReal && s.error);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("it-IT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="space-y-2 mb-6">
      {/* Main stats row */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            {[
              { color: "bg-green-500", label: "Alta compatibilità", value: high, textColor: "text-green-600" },
              { color: "bg-amber-500", label: "Media", value: medium, textColor: "text-amber-600" },
              { color: "bg-gray-400", label: "Da valutare", value: other, textColor: "text-gray-500" },
              { color: "bg-blue-500", label: "Totale", value: tenders.length, textColor: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
                <span className="text-sm text-gray-600">
                  {s.label}:{" "}
                  <span className={`font-bold ${s.textColor}`}>{isLoading ? "—" : s.value}</span>
                </span>
              </div>
            ))}
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-400">Aggiornato: {formatDate(lastUpdated)}</span>
          )}
        </div>
      </div>

      {/* Source status row */}
      {sourceMeta.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {realSources.map((s) => (
            <span key={s.source} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {s.source} — dati reali
            </span>
          ))}
          {exampleSources.map((s) => (
            <span key={s.source} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full" title={s.notice ?? ""}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {s.source} — esempi
              {s.portalUrl && (
                <a href={s.portalUrl} target="_blank" rel="noopener noreferrer" className="underline ml-0.5">↗</a>
              )}
            </span>
          ))}
          {failedSources.map((s) => (
            <span key={s.source} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full" title={s.error ?? ""}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {s.source} — errore
            </span>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            I badge arancioni sono bandi di esempio — clicca ↗ per cercare sul portale reale
          </span>
        </div>
      )}
    </div>
  );
}
