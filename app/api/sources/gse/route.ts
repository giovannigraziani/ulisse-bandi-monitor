import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

// GSE usa JS rendering — cheerio non può eseguire JavaScript.
// Forniamo esempi rappresentativi con link diretti alle pagine GSE corrette.

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "gse-ex-1",
      titolo: "[Esempio] Conto Termico 2.0 — Impianti termici a fonti rinnovabili (PA e privati)",
      fonte: "GSE",
      importo: "Incentivo fino al 65% della spesa",
      importoNumerico: 0,
      scadenza: "Sportello sempre aperto",
      stazioneAppaltante: "GSE — Gestore Servizi Energetici",
      cpvCodes: ["45331000", "71314000"],
      descrizione: "Incentivi per sostituzione impianti climatizzazione con pompe di calore, solare termico, biomasse. Dedicato a PA e privati. Verifica condizioni aggiornate su GSE.",
      linkOriginale: "https://www.gse.it/servizi-per-te/efficienza-energetica/conto-termico",
    },
    {
      id: "gse-ex-2",
      titolo: "[Esempio] Comunità Energetiche Rinnovabili (CER) — Decreto MASE 2024",
      fonte: "GSE",
      importo: "Tariffa incentivante + contributo 40% PNRR",
      importoNumerico: 0,
      scadenza: "Domande entro 2026-12-31",
      stazioneAppaltante: "GSE — Gestore Servizi Energetici",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Incentivi per impianti fotovoltaici in Comunità Energetiche Rinnovabili. Contributo a fondo perduto PNRR fino al 40% per comuni sotto 5.000 abitanti.",
      linkOriginale: "https://www.gse.it/servizi-per-te/energia-da-fonti-rinnovabili/comunita-energetiche-rinnovabili",
    },
    {
      id: "gse-ex-3",
      titolo: "[Esempio] Portale Bandi GSE — tutti gli incentivi attivi",
      fonte: "GSE",
      importo: "Vari incentivi attivi",
      importoNumerico: 0,
      scadenza: "Verifica su GSE",
      stazioneAppaltante: "GSE — Gestore Servizi Energetici",
      cpvCodes: ["09331200", "45316000", "45331000", "71314000"],
      descrizione: "Accedi al portale GSE per vedere tutti i bandi e incentivi attivi: fotovoltaico, solare termico, pompe di calore, efficienza energetica, CER.",
      linkOriginale: "https://www.gse.it/servizi-per-te/bandi-e-incentivi",
    },
  ];

  return NextResponse.json({
    tenders,
    source: "GSE",
    count: tenders.length,
    isReal: false,
    notice: "GSE usa JS rendering. Usa il link per accedere agli incentivi aggiornati.",
    portalUrl: "https://www.gse.it/servizi-per-te/bandi-e-incentivi",
  });
}
