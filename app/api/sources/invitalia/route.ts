import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

// Invitalia usa JS rendering — cheerio non può eseguire JavaScript.
// Forniamo esempi rappresentativi con link diretti alle pagine Invitalia corrette.

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "invitalia-ex-1",
      titolo: "[Esempio] Contratti di Sviluppo — Programmi industriali ed energetici",
      fonte: "Invitalia",
      importo: "Finanziamento agevolato + fondo perduto",
      importoNumerico: 0,
      scadenza: "Sportello aperto",
      stazioneAppaltante: "Invitalia S.p.A.",
      cpvCodes: ["71314000"],
      descrizione: "Agevolazioni per investimenti produttivi in programmi industriali, tutela ambientale, efficienza energetica. PMI e grandi imprese.",
      linkOriginale: "https://www.invitalia.it/cosa-facciamo/rafforziamo-le-imprese/contratti-di-sviluppo",
    },
    {
      id: "invitalia-ex-2",
      titolo: "[Esempio] PNRR — Efficienza energetica e riqualificazione edifici pubblici",
      fonte: "Invitalia",
      importo: "Contributo a fondo perduto 30–50%",
      importoNumerico: 0,
      scadenza: "Verifica su Invitalia",
      stazioneAppaltante: "Invitalia / MASE",
      cpvCodes: ["45316000", "45331000", "09331200"],
      descrizione: "Misure PNRR per efficienza energetica: fotovoltaico, LED, isolamento termico, pompe di calore. Accedi al portale per verificare le misure aperte.",
      linkOriginale: "https://www.invitalia.it/cosa-facciamo/cresciamo-in-sostenibilita",
    },
  ];

  return NextResponse.json({
    tenders,
    source: "Invitalia",
    count: tenders.length,
    isReal: false,
    notice: "Invitalia usa JS rendering. Usa il link per accedere agli incentivi aggiornati.",
    portalUrl: "https://www.invitalia.it/cosa-facciamo/rafforziamo-le-imprese",
  });
}
