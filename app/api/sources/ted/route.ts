import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";
import { CPV_CODES } from "@/lib/companyProfile";

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

function buildUrl(notice: TEDNotice): string {
  const html = notice.links?.html;
  if (html) return html["ITA"] ?? html["ita"] ?? html["ENG"] ?? Object.values(html)[0];
  const pub = notice["publication-number"];
  return pub ? `https://ted.europa.eu/it/notice/-/detail/${pub}` : "https://ted.europa.eu/";
}

export async function GET() {
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
    });

    if (!response.ok) throw new Error(`TED ${response.status}`);
    const data: { notices?: TEDNotice[] } = await response.json();
    const notices = data.notices ?? [];

    const tenders: RawTender[] = notices.map((n, i) => {
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
        linkOriginale: buildUrl(n),
      };
    });

    // If API returns nothing, use demo data
    if (tenders.length === 0) return NextResponse.json({ tenders: getDemoTED(), source: "TED" });
    return NextResponse.json({ tenders, source: "TED" });
  } catch {
    return NextResponse.json({ tenders: getDemoTED(), source: "TED" });
  }
}

function getDemoTED(): RawTender[] {
  return [
    {
      id: "ted-demo-1",
      titolo: "Lavori di installazione impianti elettrici — struttura pubblica",
      fonte: "TED",
      importo: "€ 480.000",
      importoNumerico: 480000,
      scadenza: "2026-08-15",
      stazioneAppaltante: "Ente pubblico — Italia",
      cpvCodes: ["45310000"],
      descrizione: "Progettazione esecutiva e realizzazione impianti elettrici, quadri, distribuzione.",
      linkOriginale: "https://ted.europa.eu/",
    },
    {
      id: "ted-demo-2",
      titolo: "Fornitura e installazione impianti fotovoltaici su coperture",
      fonte: "TED",
      importo: "€ 920.000",
      importoNumerico: 920000,
      scadenza: "2026-09-01",
      stazioneAppaltante: "Amministrazione pubblica — Nord Italia",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Realizzazione impianti fotovoltaici su edifici pubblici. PNRR M2C3.",
      linkOriginale: "https://ted.europa.eu/",
    },
    {
      id: "ted-demo-3",
      titolo: "Servizio di manutenzione impianti tecnologici edifici comunali",
      fonte: "TED",
      importo: "€ 310.000",
      importoNumerico: 310000,
      scadenza: "2026-07-30",
      stazioneAppaltante: "Comune — Emilia-Romagna",
      cpvCodes: ["50711000"],
      descrizione: "Manutenzione ordinaria e straordinaria impianti elettrici, termici e speciali.",
      linkOriginale: "https://ted.europa.eu/",
    },
  ];
}
