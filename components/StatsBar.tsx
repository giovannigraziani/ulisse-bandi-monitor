"use client";

import { Tender } from "@/lib/types";

interface StatsBarProps {
  tenders: Tender[];
  lastUpdated: string | null;
  isLoading: boolean;
}

export default function StatsBar({ tenders, lastUpdated, isLoading }: StatsBarProps) {
  const high = tenders.filter((t) => t.compatibilita === "Alta compatibilità").length;
  const medium = tenders.filter((t) => t.compatibilita === "Media compatibilità").length;
  const other = tenders.filter((t) => t.compatibilita === "Da valutare").length;
  const sources = [...new Set(tenders.map((t) => t.fonte))];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("it-IT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          {[
            { dot: "bg-green-500", label: "Alta compatibilità", val: high, color: "text-green-600" },
            { dot: "bg-amber-500", label: "Media", val: medium, color: "text-amber-600" },
            { dot: "bg-gray-400", label: "Da valutare", val: other, color: "text-gray-500" },
            { dot: "bg-blue-500", label: "Totale", val: tenders.length, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${s.dot}`} />
              <span className="text-sm text-gray-600">
                {s.label}: <span className={`font-bold ${s.color}`}>{isLoading ? "—" : s.val}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sources.map((s) => (
            <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {lastUpdated && (
            <span className="text-xs text-gray-400 ml-1">Aggiornato: {formatDate(lastUpdated)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
