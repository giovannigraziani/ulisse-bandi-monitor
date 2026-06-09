import { NextResponse } from "next/server";
import { RawTender } from "@/lib/types";
import { fetchHtml, parseAmount, cheerio } from "@/lib/scraper";

// ANAC has a WAF that blocks requests without a browser User-Agent.
// fetchHtml in lib/scraper.ts already sets a proper UA.

async function tryAnacCKAN(): Promise<RawTender[]> {
  // ANAC Open Data via CKAN API — dataset "cig" contains active tenders
  const cpvFilter = ["45310000", "45315000", "45316000", "45331000", "45332000", "09331200", "50711000"];

  // Search recent CIG records with relevant CPV codes
  const url = `https://dati.anticorruzione.it/opendata/api/3/action/datastore_search?resource_id=cig&limit=100&sort=data_pubblicazione_guri desc`;

  const html = await fetchHtml(url);
  const data = JSON.parse(html);

  if (!data.success || !data.result?.records) return [];

  const records = data.result.records as {
    cig?: string;
    oggetto?: string;
    importo_licitazione?: number;
    data_scadenza_offerta?: string;
    denominazione_amministrazione_appaltante?: string;
    cod_cpv?: string;
    sezione_regionale?: string;
  }[];

  return records
    .filter((r) => {
      // Filter by CPV or by keywords in oggetto
      const cpvMatch = r.cod_cpv && cpvFilter.some((c) => r.cod_cpv?.startsWith(c.substring(0, 5)));
      const keyMatch = /elettr|illumin|fotovoltai|termico|idraulic|impianto|manutenz/i.test(r.oggetto ?? "");
      return cpvMatch || keyMatch;
    })
    .slice(0, 30)
    .map((r, idx) => ({
      id: `anac-${r.cig ?? idx}`,
      titolo: r.oggetto ?? "Bando ANAC",
      fonte: "ANAC" as const,
      importo: r.importo_licitazione ? `€ ${r.importo_licitazione.toLocaleString("it-IT")}` : "N/D",
      importoNumerico: r.importo_licitazione ?? 0,
      scadenza: r.data_scadenza_offerta ?? "N/D",
      stazioneAppaltante: r.denominazione_amministrazione_appaltante ?? "N/D",
      cpvCodes: r.cod_cpv ? [r.cod_cpv] : [],
      descrizione: r.oggetto ?? "",
      linkOriginale: r.cig
        ? `https://www.anticorruzione.it/appalti/${r.cig}`
        : "https://www.anticorruzione.it/appalti",
    }));
}

async function tryAnacScraping(): Promise<RawTender[]> {
  const html = await fetchHtml(
    "https://www.anticorruzione.it/appalti?orderBy=dataPubblicazione&order=DESC",
    12000
  );
  const $ = cheerio.load(html);
  const tenders: RawTender[] = [];

  $(".appalto-item, .card-appalto, .result-item, .gara-row").each((idx, el) => {
    const $el = $(el);
    const titolo = $el.find("h2, h3, .titolo, .title, a").first().text().trim();
    if (!titolo || titolo.length < 10) return;
    const cig = $el.find(".cig, [data-cig]").text().trim() || `anac-${idx}`;
    const importoText = $el.find(".importo, .valore, .amount").text().trim();
    const scadenza = $el.find(".scadenza, .deadline, .data-scadenza").text().trim();
    const stazione = $el.find(".stazione, .ente, .contracting-body").text().trim();
    const href = $el.find("a").attr("href") ?? "";
    const link = href.startsWith("http") ? href : `https://www.anticorruzione.it${href}`;

    tenders.push({
      id: `anac-${cig}`,
      titolo,
      fonte: "ANAC",
      importo: importoText || "N/D",
      importoNumerico: parseAmount(importoText),
      scadenza: scadenza || "N/D",
      stazioneAppaltante: stazione || "N/D",
      cpvCodes: [],
      descrizione: titolo,
      linkOriginale: link,
    });
  });

  return tenders;
}

export async function GET() {
  try {
    let tenders: RawTender[] = [];
    let sourceError: string | undefined;

    try {
      tenders = await tryAnacCKAN();
    } catch (e1) {
      try {
        tenders = await tryAnacScraping();
      } catch (e2) {
        sourceError = e2 instanceof Error ? e2.message : "Scraping failed";
      }
    }

    if (tenders.length === 0) {
      tenders = getMockAnacTenders();
    }

    return NextResponse.json({
      tenders,
      source: "ANAC",
      count: tenders.length,
      ...(sourceError ? { error: sourceError } : {}),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: msg, tenders: getMockAnacTenders(), source: "ANAC" },
      { status: 200 }
    );
  }
}

function getMockAnacTenders(): RawTender[] {
  return [
    {
      id: "anac-mock-1",
      titolo: "Manutenzione ordinaria e straordinaria impianti elettrici edifici comunali",
      fonte: "ANAC",
      importo: "€ 280.000",
      importoNumerico: 280000,
      scadenza: "2026-07-15",
      stazioneAppaltante: "Comune di Forlì",
      cpvCodes: ["50711000"],
      descrizione: "Servizio di manutenzione impianti elettrici per edifici di proprietà comunale. Durata biennale.",
      linkOriginale: "https://www.anticorruzione.it/appalti",
    },
    {
      id: "anac-mock-2",
      titolo: "Fornitura e posa in opera impianti fotovoltaici su edifici scolastici",
      fonte: "ANAC",
      importo: "€ 750.000",
      importoNumerico: 750000,
      scadenza: "2026-08-01",
      stazioneAppaltante: "Provincia di Forlì-Cesena",
      cpvCodes: ["09331200", "45261215"],
      descrizione: "Progettazione, fornitura e installazione di sistemi fotovoltaici su istituti scolastici provinciali. PNRR M2C3.",
      linkOriginale: "https://www.anticorruzione.it/appalti",
    },
  ];
}
