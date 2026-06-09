"use client";

import { useState } from "react";
import { Tender } from "@/lib/types";

interface AlertFormProps {
  tenders: Tender[];
}

export default function AlertForm({ tenders }: AlertFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      setErrorMsg("Inserisci un indirizzo email valido");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const resp = await fetch("/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenders }),
      });

      const data = await resp.json();

      if (!resp.ok || data.error) {
        throw new Error(data.error ?? "Errore nell'invio");
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Errore sconosciuto");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold text-gray-700">Invia report via email</span>
          {tenders.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {tenders.length} bandi
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {tenders.length === 0 ? (
            <p className="text-sm text-gray-500">
              Esegui prima una ricerca per avere bandi da inviare.
            </p>
          ) : status === "sent" ? (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">
                Report inviato a {email}!
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Email destinatario (es. info@gruppoangelini.it)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={status === "sending"}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {status === "sending" ? "Invio…" : "Invia report"}
              </button>
            </div>
          )}
          {errorMsg && (
            <p className="text-sm text-red-500 mt-2">{errorMsg}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Il report include la lista completa dei bandi trovati con compatibilità, importo e link diretti.
          </p>
        </div>
      )}
    </div>
  );
}
