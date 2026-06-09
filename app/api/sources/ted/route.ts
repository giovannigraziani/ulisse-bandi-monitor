import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";
import { CPV_CODES, NUTS_CODES } from "@/lib/companyProfile";

interface TEDNotice {
  "notice-id"?: string;
  id?: string;
  title?: { text?: string; value?: string }[] | string;
  "short-description"?: { text?: string; value?: string }[] | string;
  "total-value"?: { value?: number; amount?: number };
  "submission-deadline-date"?: string;
  "contract-deadline"?: string;
  "contracting-body"?: { "official-name"?: string; name?: string };
  "cpv-code"?: { code?: string }[] | string[];
  "place-of-performance"?: { nuts?: string }[];
  "publication-date"?: string;
  "document-url"?: string;
  url?: string;
}

function extractText(
  field: { text?: string; value?: string }[] | string | undefined
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field)) {
    const it = field.find((f) => f.text);
    return it?.text ?? field[0]?.value ?? "";
  }
  return "";
}

function extractAmount(notice: TEDNotice): { text: string; numeric: number } {
  const val = notice["total-value"];
  if (!val) return { text: "N/D", numeric: 0 };
  const num = val.value ?? val.amount ?? 0;
  return {
    text: `€ ${num.toLocaleString("it-IT")}`,
    numeric: num,
  };
}

export async function GET() {
  try {
    const cpvQuery = CPV_CODES.map((c) => `cpv=${c}`).join(" OR ");
    const query = `(${cpvQuery}) AND co=IT`;

    const url = new URL("https://api.ted.europa.eu/v3/notices/search");
    url.searchParams.set("q", query);
    url.searchParams.set("scope", "ACTIVE");
    url.searchParams.set("pageSize", "50");
    url.searchParams.set(
      "fields",
      "notice-id,title,short-description,total-value,submission-deadline-date,contracting-body,cpv-code,place-of-performance,document-url,publication-date"
    );
    url.searchParams.set("sortBy", "publication-date");
    url.searchParams.set("sortOrder", "DESC");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`TED API error: ${response.status}`);
    }

    const data = await response.json();
    const notices: TEDNotice[] = data.notices ?? data.results ?? [];

    const tenders: RawTender[] = notices
      .filter((n) => n)
      .map((notice, idx) => {
        const id = notice["notice-id"] ?? notice.id ?? `ted-${idx}`;
        const title = extractText(notice.title) || "Bando TED";
        const desc = extractText(notice["short-description"]) || "";
        const { text: importo, numeric: importoNumerico } = extractAmount(notice);
        const scadenza =
          notice["submission-deadline-date"] ??
          notice["contract-deadline"] ??
          "N/D";
        const buyer = notice["contracting-body"];
        const stazioneAppaltante =
          buyer?.["official-name"] ?? buyer?.name ?? "N/D";

        const cpvRaw = notice["cpv-code"] ?? [];
        const cpvCodes = Array.isArray(cpvRaw)
          ? cpvRaw.map((c) => (typeof c === "string" ? c : c.code ?? ""))
          : [];

        const docUrl = notice["document-url"] ?? notice.url ?? "";
        const linkOriginale = docUrl
          ? docUrl
          : `https://ted.europa.eu/udl?uri=TED:NOTICE:${id}:TEXT:IT:HTML`;

        return {
          id: `ted-${id}`,
          titolo: title,
          fonte: "TED" as const,
          importo,
          importoNumerico,
          scadenza,
          stazioneAppaltante,
          cpvCodes,
          descrizione: desc,
          linkOriginale,
        };
      });

    // Also try NUTS-specific query for local results
    const nutsQuery = NUTS_CODES.map((n) => `nuts=${n}`).join(" OR ");
    const localUrl = new URL("https://api.ted.europa.eu/v3/notices/search");
    localUrl.searchParams.set("q", `(${nutsQuery}) AND co=IT`);
    localUrl.searchParams.set("scope", "ACTIVE");
    localUrl.searchParams.set("pageSize", "20");
    localUrl.searchParams.set(
      "fields",
      "notice-id,title,short-description,total-value,submission-deadline-date,contracting-body,cpv-code,document-url"
    );

    try {
      const localResp = await fetch(localUrl.toString(), {
        headers: { Accept: "application/json" },
      });
      if (localResp.ok) {
        const localData = await localResp.json();
        const localNotices: TEDNotice[] = localData.notices ?? localData.results ?? [];
        const localTenders: RawTender[] = localNotices
          .filter((n) => n && !tenders.find((t) => t.id.includes(n["notice-id"] ?? "")))
          .map((notice, idx) => {
            const id = notice["notice-id"] ?? `ted-local-${idx}`;
            return {
              id: `ted-local-${id}`,
              titolo: extractText(notice.title) || "Bando TED locale",
              fonte: "TED" as const,
              importo: extractAmount(notice).text,
              importoNumerico: extractAmount(notice).numeric,
              scadenza: notice["submission-deadline-date"] ?? "N/D",
              stazioneAppaltante:
                notice["contracting-body"]?.["official-name"] ?? "N/D",
              cpvCodes: [],
              descrizione: extractText(notice["short-description"]) || "",
              linkOriginale: `https://ted.europa.eu/udl?uri=TED:NOTICE:${id}:TEXT:IT:HTML`,
            };
          });
        tenders.push(...localTenders);
      }
    } catch {
      // Ignore NUTS query failures
    }

    return NextResponse.json({ tenders, source: "TED", count: tenders.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg, tenders: [], source: "TED" }, { status: 500 });
  }
}
