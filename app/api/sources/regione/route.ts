import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "regione-1",
      titolo: "Efficientamento energetico edifici pubblici — impianti termici e illuminazione LED",
      fonte: "Regione ER",
      importo: "€ 1.200.000",
      importoNumerico: 1200000,
      scadenza: "2026-09-30",
      stazioneAppaltante: "Regione Emilia-Romagna — Area Patrimonio",
      cpvCodes: ["45316000", "45331000"],
      descrizione: "Interventi PNRR M2C3: sostituzione LED, rifacimento impianti termici con pompe di calore.",
      linkOriginale: "https://piattaformateritoriale.it/",
    },
    {
      id: "regione-2",
      titolo: "Realizzazione Comunità Energetica Rinnovabile — impianti fotovoltaici aggregati",
      fonte: "Regione ER",
      importo: "€ 2.400.000",
      importoNumerico: 2400000,
      scadenza: "2026-10-15",
      stazioneAppaltante: "Unione dei Comuni della Romagna Forlivese",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Progettazione e realizzazione impianti fotovoltaici per CER. Finanziamento GSE/PNRR.",
      linkOriginale: "https://piattaformateritoriale.it/",
    },
    {
      id: "regione-3",
      titolo: "Manutenzione straordinaria rete pubblica illuminazione — smart lighting",
      fonte: "Regione ER",
      importo: "€ 380.000",
      importoNumerico: 380000,
      scadenza: "2026-07-31",
      stazioneAppaltante: "Comune — Forlimpopoli",
      cpvCodes: ["45316000"],
      descrizione: "Sostituzione corpi illuminanti con LED, telegestione, smart lighting. PNRR.",
      linkOriginale: "https://piattaformateritoriale.it/",
    },
  ];
  return NextResponse.json({ tenders, source: "Regione ER" });
}
