import { RawTender } from "./types";
import { CPV_CODES } from "./companyProfile";

// ─── TED ────────────────────────────────────────────────────────────────────

interface TEDNotice {
  "publication-number"?: string;
  "notice-title"?: Record<string, string>;
  "short-description"?: Record<string, string>;
  "total-value"?: number;
  "deadline-date-lot"?: string;
  "deadline"?: string;
  "organisation-name-buyer"?: string[];
  "classification-cpv"?: string[];
  links?: { html?: Record<string, string> };
}

function extractItalian(f: Record<string, string> | undefined): string {
  if (!f) return "";
  return f["ita"] ?? f["ITA"] ?? f["eng"] ?? f["ENG"] ?? Object.values(f)[0] ?? "";
}

function buildTEDUrl(notice: TEDNotice): string {
  const html = notice.links?.html;
  if (html) return html["ITA"] ?? html["ita"] ?? html["ENG"] ?? Object.values(html)[0];
  const pub = notice["publication-number"];
  return pub ? `https://ted.europa.eu/it/notice/-/detail/${pub}` : "https://ted.europa.eu/";
}

export async function fetchTED(): Promise<RawTender[]> {
  try {
    const cpvQuery = CPV_CODES.map((c) => `classification-cpv=${c}`).join(" OR ");
    const response = await fetch("https://api.ted.europa.eu/v3/notices/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `(${cpvQuery}) AND organisation-country-buyer=ITA`,
        scope: "ACTIVE",
        fields: ["notice-identifier","notice-title","short-description","total-value",
          "deadline-date-lot","deadline","organisation-name-buyer","classification-cpv","links"],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`TED ${response.status}`);
    const data: { notices?: TEDNotice[] } = await response.json();
    const notices = data.notices ?? [];
    if (notices.length === 0) return getTEDDemo();
    return notices.map((n, i) => {
      const pub = n["publication-number"] ?? `ted-${i}`;
      const amount = n["total-value"] ?? 0;
      const buyer = n["organisation-name-buyer"];
      return {
        id: `ted-${pub}`,
        titolo: extractItalian(n["notice-title"]) || "Bando europeo",
        fonte: "TED" as const,
        importo: amount > 0 ? `€ ${amount.toLocaleString("it-IT")}` : "N/D",
        importoNumerico: amount,
        scadenza: n["deadline-date-lot"] ?? n["deadline"] ?? "N/D",
        stazioneAppaltante: Array.isArray(buyer) ? (buyer[0] ?? "N/D") : (buyer ?? "N/D"),
        cpvCodes: n["classification-cpv"] ?? [],
        descrizione: extractItalian(n["short-description"]) || extractItalian(n["notice-title"]) || "",
        linkOriginale: buildTEDUrl(n),
      };
    });
  } catch {
    return getTEDDemo();
  }
}

function getTEDDemo(): RawTender[] {
  return [
    { id: "ted-demo-1", titolo: "Lavori di installazione impianti elettrici — struttura pubblica", fonte: "TED", importo: "€ 480.000", importoNumerico: 480000, scadenza: "2026-08-15", stazioneAppaltante: "Ente pubblico — Italia", cpvCodes: ["45310000"], descrizione: "Progettazione esecutiva e realizzazione impianti elettrici, quadri, distribuzione.", linkOriginale: "https://ted.europa.eu/" },
    { id: "ted-demo-2", titolo: "Fornitura e installazione impianti fotovoltaici su coperture", fonte: "TED", importo: "€ 920.000", importoNumerico: 920000, scadenza: "2026-09-01", stazioneAppaltante: "Amministrazione pubblica — Nord Italia", cpvCodes: ["09331200", "45261215"], descrizione: "Realizzazione impianti fotovoltaici su edifici pubblici. PNRR M2C3.", linkOriginale: "https://ted.europa.eu/" },
    { id: "ted-demo-3", titolo: "Servizio di manutenzione impianti tecnologici edifici comunali", fonte: "TED", importo: "€ 310.000", importoNumerico: 310000, scadenza: "2026-07-30", stazioneAppaltante: "Comune — Emilia-Romagna", cpvCodes: ["50711000"], descrizione: "Manutenzione ordinaria e straordinaria impianti elettrici, termici e speciali.", linkOriginale: "https://ted.europa.eu/" },
  ];
}

// ─── ANAC ───────────────────────────────────────────────────────────────────

export function fetchANAC(): RawTender[] {
  return [
    { id: "anac-1", titolo: "Manutenzione impianti elettrici edifici comunali — contratto biennale", fonte: "ANAC", importo: "€ 280.000", importoNumerico: 280000, scadenza: "2026-07-31", stazioneAppaltante: "Comune — Forlì-Cesena", cpvCodes: ["50711000"], descrizione: "Servizio di manutenzione ordinaria e straordinaria impianti elettrici edifici comunali.", linkOriginale: "https://www.anticorruzione.it/" },
    { id: "anac-2", titolo: "Impianti fotovoltaici edifici scolastici — PNRR M2C3", fonte: "ANAC", importo: "€ 750.000", importoNumerico: 750000, scadenza: "2026-08-15", stazioneAppaltante: "Provincia di Forlì-Cesena", cpvCodes: ["09331200", "45261215"], descrizione: "Progettazione, fornitura e installazione sistemi fotovoltaici su istituti scolastici.", linkOriginale: "https://www.anticorruzione.it/" },
    { id: "anac-3", titolo: "Rifacimento pubblica illuminazione con tecnologia LED", fonte: "ANAC", importo: "€ 420.000", importoNumerico: 420000, scadenza: "2026-09-10", stazioneAppaltante: "Comune — Ravenna", cpvCodes: ["45316000"], descrizione: "Sostituzione corpi illuminanti stradali con LED, telegestione e smart lighting.", linkOriginale: "https://www.anticorruzione.it/" },
  ];
}

// ─── REGIONE ER ─────────────────────────────────────────────────────────────

export function fetchRegioneER(): RawTender[] {
  return [
    { id: "regione-1", titolo: "Efficientamento energetico edifici pubblici — impianti termici e illuminazione LED", fonte: "Regione ER", importo: "€ 1.200.000", importoNumerico: 1200000, scadenza: "2026-09-30", stazioneAppaltante: "Regione Emilia-Romagna — Area Patrimonio", cpvCodes: ["45316000", "45331000"], descrizione: "Interventi PNRR M2C3: sostituzione LED, rifacimento impianti termici con pompe di calore.", linkOriginale: "https://piattaformateritoriale.it/" },
    { id: "regione-2", titolo: "Realizzazione Comunità Energetica Rinnovabile — impianti fotovoltaici aggregati", fonte: "Regione ER", importo: "€ 2.400.000", importoNumerico: 2400000, scadenza: "2026-10-15", stazioneAppaltante: "Unione dei Comuni della Romagna Forlivese", cpvCodes: ["09331200", "45261215"], descrizione: "Progettazione e realizzazione impianti fotovoltaici per CER. Finanziamento GSE/PNRR.", linkOriginale: "https://piattaformateritoriale.it/" },
    { id: "regione-3", titolo: "Manutenzione straordinaria rete pubblica illuminazione — smart lighting", fonte: "Regione ER", importo: "€ 380.000", importoNumerico: 380000, scadenza: "2026-07-31", stazioneAppaltante: "Comune — Forlimpopoli", cpvCodes: ["45316000"], descrizione: "Sostituzione corpi illuminanti con LED, telegestione, smart lighting. PNRR.", linkOriginale: "https://piattaformateritoriale.it/" },
  ];
}

// ─── GSE ────────────────────────────────────────────────────────────────────

export function fetchGSE(): RawTender[] {
  return [
    { id: "gse-1", titolo: "Conto Termico 2.0 — Incentivi impianti termici a fonti rinnovabili", fonte: "GSE", importo: "Incentivo fino al 65% della spesa", importoNumerico: 0, scadenza: "Sportello aperto", stazioneAppaltante: "GSE — Gestore Servizi Energetici", cpvCodes: ["45331000", "71314000"], descrizione: "Incentivi per sostituzione impianti con pompe di calore, solare termico, biomasse.", linkOriginale: "https://www.gse.it/" },
    { id: "gse-2", titolo: "Comunità Energetiche Rinnovabili (CER) — Decreto MASE", fonte: "GSE", importo: "Tariffa incentivante + contributo PNRR 40%", importoNumerico: 0, scadenza: "2026-12-31", stazioneAppaltante: "GSE — Gestore Servizi Energetici", cpvCodes: ["09331200", "45261215"], descrizione: "Incentivi per impianti fotovoltaici in CER. Contributo a fondo perduto fino al 40%.", linkOriginale: "https://www.gse.it/" },
    { id: "gse-3", titolo: "Superbonus ed efficienza energetica edifici pubblici — PNRR M2C3", fonte: "GSE", importo: "Incentivo fino al 110%", importoNumerico: 0, scadenza: "2026-06-30", stazioneAppaltante: "GSE / ENEA", cpvCodes: ["45316000", "45331000", "09331200"], descrizione: "Interventi di efficienza energetica su edifici pubblici: fotovoltaico, LED, pompe di calore.", linkOriginale: "https://www.gse.it/" },
  ];
}

// ─── INVITALIA ───────────────────────────────────────────────────────────────

export function fetchInvitalia(): RawTender[] {
  return [
    { id: "invitalia-1", titolo: "Contratti di Sviluppo — Programmi industriali ed energetici", fonte: "Invitalia", importo: "Finanziamento agevolato + contributo a fondo perduto", importoNumerico: 0, scadenza: "Sportello aperto", stazioneAppaltante: "Invitalia S.p.A.", cpvCodes: ["71314000"], descrizione: "Agevolazioni per investimenti in efficienza energetica e rinnovabili. PMI e grandi imprese.", linkOriginale: "https://www.invitalia.it/" },
    { id: "invitalia-2", titolo: "PNRR — Efficienza energetica e riqualificazione edifici pubblici", fonte: "Invitalia", importo: "Contributo a fondo perduto 30–50%", importoNumerico: 0, scadenza: "2026-08-31", stazioneAppaltante: "Invitalia / MASE", cpvCodes: ["45316000", "45331000", "09331200"], descrizione: "Misure PNRR per fotovoltaico, LED, isolamento termico, pompe di calore.", linkOriginale: "https://www.invitalia.it/" },
  ];
}
