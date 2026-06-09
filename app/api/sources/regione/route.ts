import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

// Il portale SATER (piattaformateritoriale.it) usa JS rendering.
// Forniamo esempi rappresentativi con link diretti alle pagine di ricerca.

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "regione-ex-1",
      titolo: "[Esempio] Efficientamento energetico edifici pubblici — impianti termici e LED",
      fonte: "Regione ER",
      importo: "€ 500.000 – € 2.000.000",
      importoNumerico: 1000000,
      scadenza: "Verifica su SATER",
      stazioneAppaltante: "Regione Emilia-Romagna / Enti locali ER",
      cpvCodes: ["45316000", "45331000"],
      descrizione: "Interventi PNRR M2C3: sostituzione LED, rifacimento impianti termici con pompe di calore, edifici pubblici. Cerca bandi attivi sul portale SATER.",
      linkOriginale: "https://piattaformateritoriale.it/portale/it/bandi-di-gara",
    },
    {
      id: "regione-ex-2",
      titolo: "[Esempio] Comunità Energetica Rinnovabile (CER) — fotovoltaico aggregato",
      fonte: "Regione ER",
      importo: "€ 1.000.000 – € 3.000.000",
      importoNumerico: 2000000,
      scadenza: "Verifica su SATER",
      stazioneAppaltante: "Unioni di Comuni ER",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Realizzazione impianti fotovoltaici per Comunità Energetiche. Finanziamento GSE/PNRR. Cerca bandi attivi sul portale SATER Emilia-Romagna.",
      linkOriginale: "https://piattaformateritoriale.it/portale/it/bandi-di-gara",
    },
    {
      id: "regione-ex-3",
      titolo: "[Esempio] Portale SATER — tutti i bandi di gara Emilia-Romagna",
      fonte: "Regione ER",
      importo: "Vari importi",
      importoNumerico: 0,
      scadenza: "Aggiornato in tempo reale",
      stazioneAppaltante: "Enti pubblici Emilia-Romagna",
      cpvCodes: ["45310000", "45316000", "45331000"],
      descrizione: "Accedi al portale SATER per trovare tutti i bandi di gara attivi in Emilia-Romagna filtrabili per categoria, importo e stazione appaltante.",
      linkOriginale: "https://piattaformateritoriale.it/portale/it/bandi-di-gara",
    },
  ];

  return NextResponse.json({
    tenders,
    source: "Regione ER",
    count: tenders.length,
    isReal: false,
    notice: "Il portale SATER usa JS rendering. Usa il link per cercare bandi reali.",
    portalUrl: "https://piattaformateritoriale.it/portale/it/bandi-di-gara",
  });
}
