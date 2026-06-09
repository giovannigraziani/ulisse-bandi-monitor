import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "anac-1",
      titolo: "Manutenzione impianti elettrici edifici comunali — contratto biennale",
      fonte: "ANAC",
      importo: "€ 280.000",
      importoNumerico: 280000,
      scadenza: "2026-07-31",
      stazioneAppaltante: "Comune — Forlì-Cesena",
      cpvCodes: ["50711000"],
      descrizione: "Servizio di manutenzione ordinaria e straordinaria impianti elettrici edifici comunali.",
      linkOriginale: "https://www.anticorruzione.it/",
    },
    {
      id: "anac-2",
      titolo: "Impianti fotovoltaici edifici scolastici — PNRR M2C3",
      fonte: "ANAC",
      importo: "€ 750.000",
      importoNumerico: 750000,
      scadenza: "2026-08-15",
      stazioneAppaltante: "Provincia di Forlì-Cesena",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Progettazione, fornitura e installazione sistemi fotovoltaici su istituti scolastici.",
      linkOriginale: "https://www.anticorruzione.it/",
    },
    {
      id: "anac-3",
      titolo: "Rifacimento pubblica illuminazione con tecnologia LED",
      fonte: "ANAC",
      importo: "€ 420.000",
      importoNumerico: 420000,
      scadenza: "2026-09-10",
      stazioneAppaltante: "Comune — Ravenna",
      cpvCodes: ["45316000"],
      descrizione: "Sostituzione corpi illuminanti stradali con LED, telegestione e smart lighting.",
      linkOriginale: "https://www.anticorruzione.it/",
    },
  ];
  return NextResponse.json({ tenders, source: "ANAC" });
}
