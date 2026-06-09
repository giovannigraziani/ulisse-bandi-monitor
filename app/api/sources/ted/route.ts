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
  links?: {
    html?: Record<string, string>;
    htmlDirect?: Record<string, string>;
  };
}

function extractItalian(field: Record<string, string> | undefined): string {
  if (!field) return "";
  return field["ita"] ?? field["ITA"] ?? field["eng"] ?? field["ENG"] ?? Object.values(field)[0] ?? "";
}

function buildUrl(notice: TEDNotice): string {
  const html = notice.links?.html;
  if (html) return html["ITA"] ?? html["ita"] ?? html["ENG"] ?? html["eng"] ?? Object.values(html)[0];
  const pub = notice["publication-number"];
  return pub ? `https://ted.europa.eu/it/notice/-/detail/${pub}` : "https://ted.europa.eu/";
}

export async function GET() {
  try {
    // Build OR query across all CPV codes, filtered to Italy
    const cpvQuery = CPV_CODES.map((c) => `classification-cpv=${c}`).join(" OR ");
    const query = `(${cpvQuery}) AND organisation-country-buyer=ITA`;

    const response = await fetch("https://api.ted.europa.eu/v3/notices/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query,
        scope: "ACTIVE",
        fields: [
          "notice-identifier",
          "notice-title",
          "short-description",
          "total-value",
          "deadline-date-lot",
          "deadline",
          "organisation-name-buyer",
          "classification-cpv",
          "links",
          "publication-date",
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`TED API ${response.status}: ${err.substring(0, 200)}`);
    }

    const data: { notices?: TEDNotice[] } = await response.json();
    const notices = data.notices ?? [];

    const tenders: RawTender[] = notices.map((notice, idx) => {
      const pubNum = notice["publication-number"] ?? `ted-${idx}`;
      const amount = notice["total-value"] ?? 0;
      const cpvCodes = notice["classification-cpv"] ?? [];
      const buyer = notice["organisation-name-buyer"];

      return {
        id: `ted-${pubNum}`,
        titolo: extractItalian(notice["notice-title"]) || "Bando TED",
        fonte: "TED" as const,
        importo: amount > 0 ? `€ ${amount.toLocaleString("it-IT")}` : "N/D",
        importoNumerico: amount,
        scadenza: notice["deadline-date-lot"] ?? notice["deadline"] ?? "N/D",
        stazioneAppaltante: Array.isArray(buyer) ? (buyer[0] ?? "N/D") : (buyer ?? "N/D"),
        cpvCodes,
        descrizione: extractItalian(notice["short-description"]) || extractItalian(notice["notice-title"]) || "",
        linkOriginale: buildUrl(notice),
      };
    });

    return NextResponse.json({ tenders, source: "TED", count: tenders.length, isReal: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg, tenders: [], source: "TED", isReal: false }, { status: 500 });
  }
}
