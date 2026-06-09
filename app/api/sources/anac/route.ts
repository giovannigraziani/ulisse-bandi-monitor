import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

// ANAC non espone API pubblica di ricerca per bandi.
// Il portale usa JS rendering e i dataset open data sono >500MB.
// Forniamo esempi rappresentativi con link diretti al portale pre-filtrato per CPV.

const ANAC_SEARCH_BASE = "https://www.anticorruzione.it/appalti";

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "anac-ex-1",
      titolo: "[Esempio] Manutenzione impianti elettrici edifici comunali — biennale",
      fonte: "ANAC",
      importo: "€ 250.000 – € 400.000",
      importoNumerico: 300000,
      scadenza: "Verifica su ANAC",
      stazioneAppaltante: "Comuni Emilia-Romagna",
      cpvCodes: ["50711000"],
      descrizione: "Servizio di manutenzione ordinaria e straordinaria di impianti elettrici per edifici di proprietà comunale. Cerca bandi attivi su ANAC con CPV 50711000.",
      linkOriginale: ANAC_SEARCH_BASE,
    },
    {
      id: "anac-ex-2",
      titolo: "[Esempio] Impianti fotovoltaici su edifici scolastici — PNRR M2C3",
      fonte: "ANAC",
      importo: "€ 500.000 – € 2.000.000",
      importoNumerico: 750000,
      scadenza: "Verifica su ANAC",
      stazioneAppaltante: "Province e Comuni ER",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Progettazione, fornitura e installazione sistemi fotovoltaici su edifici pubblici. Cerca bandi attivi su ANAC con CPV 09331200.",
      linkOriginale: ANAC_SEARCH_BASE,
    },
    {
      id: "anac-ex-3",
      titolo: "[Esempio] Pubblica illuminazione LED — sostituzione corpi illuminanti",
      fonte: "ANAC",
      importo: "€ 300.000 – € 800.000",
      importoNumerico: 400000,
      scadenza: "Verifica su ANAC",
      stazioneAppaltante: "Comuni vari ER",
      cpvCodes: ["45316000"],
      descrizione: "Sostituzione corpi illuminanti con LED, telegestione, smart lighting. Cerca bandi attivi su ANAC con CPV 45316000.",
      linkOriginale: ANAC_SEARCH_BASE,
    },
  ];

  return NextResponse.json({
    tenders,
    source: "ANAC",
    count: tenders.length,
    isReal: false,
    notice: "ANAC non espone API di ricerca pubblica. Usa il link per cercare bandi reali sul portale.",
    portalUrl: ANAC_SEARCH_BASE,
  });
}
