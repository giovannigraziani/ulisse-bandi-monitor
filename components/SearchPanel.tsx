"use client";

import { useState } from "react";

const SOURCES = ["TED", "ANAC", "Regione ER", "GSE", "Invitalia"];

interface SearchPanelProps {
  onSearch: (config: {
    sources: string[];
    minAmount: number;
    filter: string;
  }) => void;
  isLoading: boolean;
}

export default function SearchPanel({ onSearch, isLoading }: SearchPanelProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>(SOURCES);
  const [minAmount, setMinAmount] = useState(50000);
  const [filter, setFilter] = useState("all");

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleSearch = () => {
    onSearch({ sources: selectedSources, minAmount, filter });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
        Configurazione ricerca
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sources */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Fonti dati
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((source) => (
              <button
                key={source}
                onClick={() => toggleSource(source)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  selectedSources.includes(source)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {/* Min amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Importo minimo: <span className="text-gray-900 font-bold">€ {minAmount.toLocaleString("it-IT")}</span>
          </label>
          <input
            type="range"
            min={0}
            max={500000}
            step={10000}
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>€ 0</span>
            <span>€ 500.000</span>
          </div>
        </div>

        {/* Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Mostra
          </label>
          <div className="flex flex-col gap-1.5">
            {[
              { value: "all", label: "Tutti i bandi" },
              { value: "high", label: "Solo alta compatibilità" },
              { value: "high+medium", label: "Alta e media compatibilità" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filter"
                  value={opt.value}
                  checked={filter === opt.value}
                  onChange={() => setFilter(opt.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={handleSearch}
          disabled={isLoading || selectedSources.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analisi in corso…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cerca bandi
            </>
          )}
        </button>
      </div>
    </div>
  );
}
