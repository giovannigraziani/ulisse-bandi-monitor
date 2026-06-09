"use client";

import { useState, useCallback } from "react";
import { Tender, SearchResponse } from "@/lib/types";
import SearchPanel from "./SearchPanel";
import ResultCard from "./ResultCard";
import StatsBar from "./StatsBar";
import AlertForm from "./AlertForm";

type SortMode = "score" | "scadenza" | "importo";

export default function Dashboard() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleSearch = useCallback(
    async (config: { sources: string[]; minAmount: number; filter: string }) => {
      setIsLoading(true);
      setError(null);
      setFilterMode(config.filter);
      try {
        const resp = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sources: config.sources, minAmount: config.minAmount }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data: SearchResponse = await resp.json();
        setTenders(data.tenders);
        setLastUpdated(data.lastUpdated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      } finally {
        setIsLoading(false);
      }
    }, []
  );

  const categories = ["all", ...new Set(tenders.map((t) => t.tagCategoria))];

  const filtered = tenders
    .filter((t) => {
      if (filterMode === "high") return t.compatibilita === "Alta compatibilità";
      if (filterMode === "high+medium") return t.compatibilita !== "Da valutare";
      return true;
    })
    .filter((t) => categoryFilter === "all" || t.tagCategoria === categoryFilter)
    .sort((a, b) => {
      if (sortMode === "importo") return b.importoNumerico - a.importoNumerico;
      if (sortMode === "scadenza") return (a.scadenza ?? "").localeCompare(b.scadenza ?? "");
      return b.score - a.score;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 rounded-xl p-2.5">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Ulisse</h1>
                <p className="text-slate-300 text-sm">Monitor bandi pubblici e PNRR · powered by AI</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["TED Europa", "ANAC", "Regione ER", "GSE", "Invitalia"].map((s) => (
                <span key={s} className="text-xs bg-white/10 text-slate-200 px-2 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchPanel onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            <strong>Errore:</strong> {error}
          </div>
        )}

        {(tenders.length > 0 || isLoading) && (
          <StatsBar tenders={tenders} lastUpdated={lastUpdated} isLoading={isLoading} />
        )}

        {tenders.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-white text-gray-600 border-gray-300 hover:border-slate-500"
                  }`}>
                  {cat === "all" ? "Tutte le categorie" : cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Ordina per:</span>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                <option value="score">Compatibilità</option>
                <option value="importo">Importo</option>
                <option value="scadenza">Scadenza</option>
              </select>
              <span className="text-xs text-gray-400">{filtered.length} bandi</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="animate-spin h-10 w-10 text-slate-600 mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-medium">Ricerca in corso…</p>
            <p className="text-sm mt-1 text-gray-400">Interrogo le fonti e analizzo i bandi con AI</p>
          </div>
        ) : tenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="h-14 w-14 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="font-medium text-lg text-gray-500">Nessun bando trovato</p>
            <p className="text-sm mt-1">Configura le fonti e avvia la ricerca</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              {[
                { icon: "🇪🇺", title: "TED Europa", desc: "Appalti pubblici UE sopra soglia." },
                { icon: "🇮🇹", title: "ANAC & Regione ER", desc: "Bandi nazionali e regionali." },
                { icon: "☀️", title: "GSE & Invitalia", desc: "Incentivi PNRR, fotovoltaico, CER." },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-gray-700 mb-1 text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessun bando corrisponde ai filtri selezionati.</p>
            <button onClick={() => { setFilterMode("all"); setCategoryFilter("all"); }}
              className="text-slate-600 text-sm mt-2 hover:underline">Rimuovi filtri</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {filtered.map((tender) => <ResultCard key={tender.id} tender={tender} />)}
          </div>
        )}

        {tenders.length > 0 && <AlertForm tenders={filtered} />}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 mt-8">
        Ulisse · Monitor bandi pubblici e PNRR · TED Europa · ANAC · Regione ER · GSE · Invitalia
      </footer>
    </div>
  );
}
