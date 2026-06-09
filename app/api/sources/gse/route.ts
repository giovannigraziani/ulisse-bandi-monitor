import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "gse-1",
      titolo: "Conto Termico 2.0 — Incentivi impianti termici a fonti rinnovabili",
      fonte: "GSE",
      importo: "Incentivo fino al 65% della spesa",
      importoNumerico: 0,
      scadenza: "Sportello aperto",
      stazioneAppaltante: "GSE — Gestore Servizi Energetici",
      cpvCodes: ["45331000", "71314000"],
      descrizione: "Incentivi per sostituzione impianti con pompe di calore, solare termico, biomasse. PA e privati.",
      linkOriginale: "https://www.gse.it/",
    },
    {
      id: "gse-2",
      titolo: "Comunità Energetiche Rinnovabili (CER) — Decreto MASE",
      fonte: "GSE",
      importo: "Tariffa incentivante + contributo PNRR 40%",
      importoNumerico: 0,
      scadenza: "2026-12-31",
      stazioneAppaltante: "GSE — Gestore Servizi Energetici",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Incentivi per impianti fotovoltaici in CER. Contributo a fondo perduto fino al 40%.",
      linkOriginale: "https://www.gse.it/",
    },
    {
      id: "gse-3",
      titolo: "Superbonus ed efficienza energetica edifici pubblici — PNRR M2C3",
      fonte: "GSE",
      importo: "Incentivo fino al 110%",
      importoNumerico: 0,
      scadenza: "2026-06-30",
      stazioneAppaltante: "GSE / ENEA",
      cpvCodes: ["45316000", "45331000", "09331200"],
      descrizione: "Interventi di efficienza energetica su edifici pubblici: fotovoltaico, LED, pompe di calore.",
      linkOriginale: "https://www.gse.it/",
    },
  ];
  return NextResponse.json({ tenders, source: "GSE" });
}
