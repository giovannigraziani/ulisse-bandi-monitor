"use client";

import { useState, useCallback } from "react";
import { Tender, SearchResponse } from "@/lib/types";
import SearchPanel from "./SearchPanel";
import ResultCard from "./ResultCard";
import StatsBar from "./StatsBar";
import AlertForm from "./AlertForm";

type FilterMode = "all" | "high" | "high+medium";
type SortMode = "score" | "scadenza" | "importo";
type CategoryFilter = "all" | string;

export default function Dashboard() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceErrors, setSourceErrors] = useState<{ source: string; error: string }[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchSources, setSearchSources] = useState<string[]>([]);

  const handleSearch = useCallback(
    async (config: { sources: string[]; minAmount: number; filter: string }) => {
      setIsLoading(true);
      setError(null);
      setSourceErrors([]);
      setSearchSources(config.sources);
      setFilterMode(config.filter as FilterMode);

      try {
        const resp = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sources: config.sources,
            minAmount: config.minAmount,
          }),
        });

        if (!resp.ok) {
          const data = await resp.json();
          throw new Error(data.error ?? `HTTP ${resp.status}`);
        }

        const data: SearchResponse = await resp.json();
        setTenders(data.tenders);
        setLastUpdated(data.lastUpdated);
        setSourceErrors(data.sourceErrors ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Filter and sort
  const categories = ["all", ...new Set(tenders.map((t) => t.tagCategoria))];

  const filtered = tenders
    .filter((t) => {
      if (filterMode === "high") return t.compatibilita === "Alta compatibilità";
      if (filterMode === "high+medium")
        return (
          t.compatibilita === "Alta compatibilità" ||
          t.compatibilita === "Media compatibilità"
        );
      return true;
    })
    .filter((t) => categoryFilter === "all" || t.tagCategoria === categoryFilter)
    .sort((a, b) => {
      if (sortMode === "score") return b.score - a.score;
      if (sortMode === "importo") return b.importoNumerico - a.importoNumerico;
      if (sortMode === "scadenza") {
        return (a.scadenza ?? "").localeCompare(b.scadenza ?? "");
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🏗️</span>
                <h1 className="text-2xl font-bold tracking-tight">
                  Angelini Bandi Monitor
                </h1>
              </div>
              <p className="text-blue-200 text-sm">
                Gruppo Angelini S.r.l. — Monitoraggio bandi pubblici e PNRR
              </p>
            </div>
            <div className="text-right text-sm text-blue-200">
              <div>Impiantistica civile e industriale</div>
              <div>Forlimpopoli (FC) · dal 1962</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search panel */}
        <SearchPanel onSearch={handleSearch} isLoading={isLoading} />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong>Errore:</strong> {error}
              {sourceErrors.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {sourceErrors.map((se) => (
                    <li key={se.source}>
                      {se.source}: {se.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Source errors (non-critical) */}
        {!error && sourceErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 mb-6 text-sm">
            <strong>Avviso:</strong> Alcune fonti non hanno risposto:{" "}
            {sourceErrors.map((se) => se.source).join(", ")}. I risultati disponibili sono mostrati.
          </div>
        )}

        {/* Stats bar */}
        {(tenders.length > 0 || isLoading) && (
          <StatsBar tenders={tenders} lastUpdated={lastUpdated} isLoading={isLoading} />
        )}

        {/* Results toolbar */}
        {tenders.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {cat === "all" ? "Tutte le categorie" : cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Ordina per:</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Compatibilità</option>
                <option value="importo">Importo</option>
                <option value="scadenza">Scadenza</option>
              </select>
              <span className="text-xs text-gray-400">
                {filtered.length} bandi
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-medium">Raccolta dati in corso…</p>
            <p className="text-sm mt-1 text-gray-400">
              Interrogo le fonti e analizzo i bandi con Claude AI
            </p>
          </div>
        ) : tenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-medium text-lg text-gray-500">Nessun bando trovato</p>
            <p className="text-sm mt-1">
              Configura le fonti e avvia la ricerca per trovare bandi compatibili
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessun bando corrisponde ai filtri selezionati.</p>
            <button
              onClick={() => {
                setFilterMode("all");
                setCategoryFilter("all");
              }}
              className="text-blue-600 text-sm mt-2 hover:underline"
            >
              Rimuovi filtri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {filtered.map((tender) => (
              <ResultCard key={tender.id} tender={tender} />
            ))}
          </div>
        )}

        {/* Alert form */}
        {tenders.length > 0 && <AlertForm tenders={filtered} />}

        {/* Empty state prompt */}
        {tenders.length === 0 && !isLoading && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🇪🇺",
                title: "TED Europa",
                desc: "Appalti pubblici UE sopra soglia. API gratuita e affidabile.",
              },
              {
                icon: "🇮🇹",
                title: "ANAC & Regione ER",
                desc: "Bandi nazionali e regionali per Emilia-Romagna.",
              },
              {
                icon: "☀️",
                title: "GSE & Invitalia",
                desc: "Incentivi PNRR, fotovoltaico, CER, efficienza energetica.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-gray-700 mb-1">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 mt-8">
        Angelini Bandi Monitor — Powered by Claude AI · Dati da TED, ANAC, Regione ER, GSE, Invitalia
      </footer>
    </div>
  );
}
