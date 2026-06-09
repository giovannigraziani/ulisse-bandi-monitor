import { NextRequest, NextResponse } from "next/server";
import { RawTender, SearchResponse } from "@/lib/types";
import { applyScoring } from "@/lib/scorer";
import { enrichWithGemini } from "@/lib/gemini";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function fetchSource(source: string): Promise<RawTender[]> {
  const map: Record<string, string> = {
    TED: `${BASE_URL}/api/sources/ted`,
    ANAC: `${BASE_URL}/api/sources/anac`,
    "Regione ER": `${BASE_URL}/api/sources/regione`,
    GSE: `${BASE_URL}/api/sources/gse`,
    Invitalia: `${BASE_URL}/api/sources/invitalia`,
  };
  try {
    const resp = await fetch(map[source], { signal: AbortSignal.timeout(15000) });
    const data = await resp.json();
    return data.tenders ?? [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sources = ["TED","ANAC","Regione ER","GSE","Invitalia"], minAmount = 0 } = await req.json();

    const results = await Promise.allSettled(sources.map((s: string) => fetchSource(s)));
    const allTenders: RawTender[] = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
    const unique = Array.from(new Map(allTenders.map((t) => [t.id, t])).values());

    const { scored, needAIIds } = applyScoring(unique);

    const toEnrich = scored.filter((t) => needAIIds.includes(t.id)).slice(0, 20);
    if (toEnrich.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const enriched = await enrichWithGemini(toEnrich);
        for (const e of enriched) {
          const i = scored.findIndex((t) => t.id === e.id);
          if (i !== -1) scored[i] = { ...scored[i], ...e, categoria: e.tagCategoria };
        }
      } catch { /* AI enrichment is optional */ }
    }

    const filtered = scored
      .filter((t) => t.importoNumerico === 0 || t.importoNumerico >= minAmount)
      .sort((a, b) => b.score - a.score);

    const response: SearchResponse = {
      tenders: filtered,
      lastUpdated: new Date().toISOString(),
      totalFound: filtered.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Ulisse API — POST /api/search" });
}
