"use client";

import { Tender } from "@/lib/types";

interface ResultCardProps {
  tender: Tender;
}

const FONTE_COLORS: Record<string, string> = {
  TED: "bg-purple-100 text-purple-700 border-purple-200",
  ANAC: "bg-blue-100 text-blue-700 border-blue-200",
  "Regione ER": "bg-teal-100 text-teal-700 border-teal-200",
  GSE: "bg-orange-100 text-orange-700 border-orange-200",
  Invitalia: "bg-pink-100 text-pink-700 border-pink-200",
};

const TAG_COLORS: Record<string, string> = {
  "Impianti elettrici": "bg-yellow-100 text-yellow-800",
  Fotovoltaico: "bg-green-100 text-green-800",
  Termoidraulica: "bg-red-100 text-red-800",
  "Pubblica illuminazione": "bg-sky-100 text-sky-800",
  "Efficienza energetica": "bg-emerald-100 text-emerald-800",
  CER: "bg-lime-100 text-lime-800",
  Manutenzione: "bg-gray-100 text-gray-800",
  Altro: "bg-slate-100 text-slate-800",
};

export default function ResultCard({ tender }: ResultCardProps) {
  const isHigh = tender.compatibilita === "Alta compatibilità";
  const isMedium = tender.compatibilita === "Media compatibilità";

  const borderColor = isHigh
    ? "border-l-green-500"
    : isMedium
      ? "border-l-amber-500"
      : "border-l-gray-300";

  const badgeBg = isHigh
    ? "bg-green-100 text-green-700 border-green-200"
    : isMedium
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-gray-100 text-gray-600 border-gray-200";

  const scoreColor = isHigh
    ? "text-green-600"
    : isMedium
      ? "text-amber-600"
      : "text-gray-400";

  const fonteClass = FONTE_COLORS[tender.fonte] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const tagClass = TAG_COLORS[tender.tagCategoria] ?? "bg-slate-100 text-slate-800";

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow p-5`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${fonteClass}`}>
            {tender.fonte}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagClass}`}>
            {tender.tagCategoria}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeBg}`}>
            {tender.compatibilita}
          </span>
          <span className={`text-sm font-bold ${scoreColor}`}>{tender.score}/100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div
          className={`h-1.5 rounded-full transition-all ${isHigh ? "bg-green-500" : isMedium ? "bg-amber-500" : "bg-gray-300"}`}
          style={{ width: `${tender.score}%` }}
        />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-1 leading-snug">
        {tender.titolo}
      </h3>
      <p className="text-sm text-gray-500 mb-3">{tender.stazioneAppaltante}</p>

      {/* Why relevant */}
      {tender.perche_rilevante && (
        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3 italic">
          💡 {tender.perche_rilevante}
        </p>
      )}

      {/* Key requirements */}
      {tender.requisiti_chiave && tender.requisiti_chiave.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Requisiti chiave
          </p>
          <ul className="space-y-0.5">
            {tender.requisiti_chiave.map((req, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">·</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>
            <span className="text-gray-400">Importo:</span>{" "}
            <span className="font-medium">{tender.importo}</span>
          </span>
          <span>
            <span className="text-gray-400">Scadenza:</span>{" "}
            <span className="font-medium">{tender.scadenza}</span>
          </span>
        </div>
        <a
          href={tender.linkOriginale}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          Apri bando →
        </a>
      </div>

      {/* CPV codes */}
      {tender.cpvCodes && tender.cpvCodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tender.cpvCodes.map((cpv) => (
            <span key={cpv} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              CPV {cpv}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
