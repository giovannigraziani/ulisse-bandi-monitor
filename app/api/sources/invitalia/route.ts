import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";

export async function GET() {
  const tenders: RawTender[] = [
    {
      id: "invitalia-1",
      titolo: "Contratti di Sviluppo — Programmi industriali ed energetici",
      fonte: "Invitalia",
      importo: "Finanziamento agevolato + contributo a fondo perduto",
      importoNumerico: 0,
      scadenza: "Sportello aperto",
      stazioneAppaltante: "Invitalia S.p.A.",
      cpvCodes: ["71314000"],
      descrizione: "Agevolazioni per investimenti in efficienza energetica e rinnovabili. PMI e grandi imprese.",
      linkOriginale: "https://www.invitalia.it/",
    },
    {
      id: "invitalia-2",
      titolo: "PNRR — Efficienza energetica e riqualificazione edifici pubblici",
      fonte: "Invitalia",
      importo: "Contributo a fondo perduto 30–50%",
      importoNumerico: 0,
      scadenza: "2026-08-31",
      stazioneAppaltante: "Invitalia / MASE",
      cpvCodes: ["45316000", "45331000", "09331200"],
      descrizione: "Misure PNRR per fotovoltaico, LED, isolamento termico, pompe di calore.",
      linkOriginale: "https://www.invitalia.it/",
    },
  ];
  return NextResponse.json({ tenders, source: "Invitalia" });
}
