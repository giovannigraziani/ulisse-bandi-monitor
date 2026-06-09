import { NextRequest, NextResponse } from "next/server";
import { RawTender, SearchResponse } from "@/lib/types";
import { scoreWithClaude } from "@/lib/anthropic";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function fetchSource(
  source: string
): Promise<{ tenders: RawTender[]; error?: string }> {
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
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();
    return {
      tenders: data.tenders ?? [],
      error: data.error,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return { tenders: [], error: msg };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sources = ["TED", "ANAC", "Regione ER", "GSE", "Invitalia"],
      minAmount = 50000,
    } = body;

    // Fetch all sources in parallel
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
        sourceErrors.push({
          source: sourceName,
          error: result.reason?.message ?? "Unknown error",
        });
      }
    });

    // Deduplicate by ID
    const unique = Array.from(
      new Map(allTenders.map((t) => [t.id, t])).values()
    );

    // Score with Claude AI
    let scored = await scoreWithClaude(unique);

    // Filter by minimum amount (only if we have a numeric amount)
    scored = scored.filter(
      (t) => t.importoNumerico === 0 || t.importoNumerico >= minAmount
    );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const response: SearchResponse = {
      tenders: scored,
      lastUpdated: new Date().toISOString(),
      sourceErrors,
      totalFound: scored.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET for quick test
export async function GET() {
  return NextResponse.json({
    message: "Angelini Bandi Monitor API",
    usage: "POST /api/search with { sources: [], minAmount: 50000 }",
  });
}
