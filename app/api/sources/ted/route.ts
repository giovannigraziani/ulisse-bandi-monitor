import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";
import { CPV_CODES } from "@/lib/companyProfile";

interface TEDNotice {
  "publication-number"?: string;
  "notice-title"?: Record<string, string> | string;
  "short-description"?: Record<string, string> | string;
  "total-value"?: number;
  "deadline-date-lot"?: string;
  "deadline"?: string;
  "organisation-name-buyer"?: string[];
  "classification-cpv"?: string[];
  "document-url-lot"?: string;
  "publication-date"?: string;
  links?: {
    html?: Record<string, string>;
    pdf?: Record<string, string>;
  };
}

function extractTitle(field: Record<string, string> | string | undefined): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field["ITA"] ?? field["ENG"] ?? field["FRA"] ?? Object.values(field)[0] ?? "";
}

function buildNoticeUrl(notice: TEDNotice): string {
  const pubNum = notice["publication-number"];
  if (notice.links?.html) {
    return notice.links.html["ITA"] ?? notice.links.html["ENG"] ?? Object.values(notice.links.html)[0] ?? "";
  }
  if (pubNum) {
    return `https://ted.europa.eu/en/notice/${pubNum}`;
  }
  return "https://ted.europa.eu/";
}

export async function GET() {
  try {
    // TED v3 requires POST with JSON body
    const cpvQuery = CPV_CODES.map((c) => `classification-cpv=${c}`).join(" OR ");
    const query = `(${cpvQuery}) AND publication-country=IT`;

    const response = await fetch("https://api.ted.europa.eu/v3/notices/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        scope: "ACTIVE",
        fields: [
          "notice-identifier",
          "notice-title",
          "total-value",
          "deadline-date-lot",
          "deadline",
          "organisation-name-buyer",
          "classification-cpv",
          "document-url-lot",
          "publication-date",
          "links",
          "short-description",
        ],
        "sort-field": "publication-date",
        "sort-order": "DESC",
        "page-size": 50,
      }),
    });

    // If page-size is rejected try without it
    let data: { notices?: TEDNotice[] };
    if (response.ok) {
      data = await response.json();
    } else {
      // Retry without page-size
      const retry = await fetch("https://api.ted.europa.eu/v3/notices/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query,
          scope: "ACTIVE",
          fields: [
            "notice-identifier",
            "notice-title",
            "total-value",
            "deadline-date-lot",
            "deadline",
            "organisation-name-buyer",
            "classification-cpv",
            "document-url-lot",
            "publication-date",
            "links",
          ],
        }),
      });
      if (!retry.ok) {
        const err = await retry.text();
        throw new Error(`TED API: ${err.substring(0, 200)}`);
      }
      data = await retry.json();
    }

    const notices: TEDNotice[] = data.notices ?? [];

    const tenders: RawTender[] = notices.map((notice, idx) => {
      const pubNum = notice["publication-number"] ?? `ted-${idx}`;
      const title = extractTitle(notice["notice-title"]) || "Bando TED";
      const desc = extractTitle(notice["short-description"]) || title;
      const amount = notice["total-value"] ?? 0;
      const scadenza = notice["deadline-date-lot"] ?? notice["deadline"] ?? "N/D";
      const buyer = notice["organisation-name-buyer"];
      const stazioneAppaltante = Array.isArray(buyer) ? buyer[0] : buyer ?? "N/D";
      const cpvCodes = notice["classification-cpv"] ?? [];
      const link = buildNoticeUrl(notice);

      return {
        id: `ted-${pubNum}`,
        titolo: title,
        fonte: "TED" as const,
        importo: amount > 0 ? `€ ${amount.toLocaleString("it-IT")}` : "N/D",
        importoNumerico: amount,
        scadenza,
        stazioneAppaltante,
        cpvCodes,
        descrizione: desc,
        linkOriginale: link,
      };
    });

    return NextResponse.json({ tenders, source: "TED", count: tenders.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg, tenders: [], source: "TED" }, { status: 500 });
  }
}
