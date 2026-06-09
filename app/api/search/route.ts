import { NextRequest, NextResponse } from "next/server";
import { RawTender, SearchResponse } from "@/lib/types";
import { applyScoring } from "@/lib/scorer";
import { enrichWithGemini } from "@/lib/gemini";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function fetchSource(source: string): Promise<{ tenders: RawTender[]; error?: string }> {
  const sourceMap: Record<string, string> = {
    TED: `${BASE_URL}/api/sources/ted`,
    ANAC: `${BASE_URL}/api/sources/anac`,
    "Regione ER": `${BASE_URL}/api/sources/regione`,
    GSE: `${BASE_URL}/api/sources/gse`,
    Invitalia: `${BASE_URL}/api/sources/invitalia`,
  };

  const url = sourceMap[source];
  if (!url) return { tenders: [], error: `Unknown source: ${source}` };

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await resp.json();
    return { tenders: data.tenders ?? [], error: data.error };
  } catch (err) {
    return { tenders: [], error: err instanceof Error ? err.message : "Fetch failed" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sources = ["TED", "ANAC", "Regione ER", "GSE", "Invitalia"],
      minAmount = 50000,
    } = body;

    // 1. Fetch all sources in parallel
    const fetchResults = await Promise.allSettled(
      sources.map((s: string) => fetchSource(s))
    );

    const allTenders: RawTender[] = [];
    const sourceErrors: { source: string; error: string }[] = [];

    fetchResults.forEach((result, idx) => {
      const sourceName = sources[idx];
      if (result.status === "fulfilled") {
        allTenders.push(...result.value.tenders);
        if (result.value.error) {
          sourceErrors.push({ source: sourceName, error: result.value.error });
        }
      } else {
        sourceErrors.push({ source: sourceName, error: result.reason?.message ?? "Error" });
      }
    });

    // Deduplicate
    const unique = Array.from(new Map(allTenders.map((t) => [t.id, t])).values());

    // 2. Deterministic scoring (zero AI cost)
    const { scored, needAIIds } = applyScoring(unique);

    // 3. AI enrichment ONLY for ambiguous tenders (no CPV, low score)
    //    Capped at 20 to stay well within Gemini free tier
    const toEnrich = scored
      .filter((t) => needAIIds.includes(t.id))
      .slice(0, 20);

    if (toEnrich.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const enriched = await enrichWithGemini(toEnrich);
        for (const enrichment of enriched) {
          const idx = scored.findIndex((t) => t.id === enrichment.id);
          if (idx !== -1) {
            scored[idx] = {
              ...scored[idx],
              score: enrichment.score,
              compatibilita: enrichment.compatibilita,
              tagCategoria: enrichment.tagCategoria,
              categoria: enrichment.tagCategoria,
              perche_rilevante: enrichment.perche_rilevante,
              requisiti_chiave: enrichment.requisiti_chiave,
            };
          }
        }
      } catch (aiErr) {
        // AI enrichment is optional — don't fail the whole request
        console.error("Gemini enrichment failed:", aiErr);
        sourceErrors.push({
          source: "Gemini AI",
          error: aiErr instanceof Error ? aiErr.message : "AI error",
        });
      }
    }

    // 4. Filter by minimum amount and sort by score
    const filtered = scored
      .filter((t) => t.importoNumerico === 0 || t.importoNumerico >= minAmount)
      .sort((a, b) => b.score - a.score);

    const response: SearchResponse = {
      tenders: filtered,
      lastUpdated: new Date().toISOString(),
      sourceErrors,
      totalFound: filtered.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Angelini Bandi Monitor API",
    scoring: "Deterministic (CPV+NUTS+keyword rules) + Gemini Flash only for ambiguous tenders",
  });
}
