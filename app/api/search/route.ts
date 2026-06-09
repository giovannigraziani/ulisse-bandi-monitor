import { NextRequest, NextResponse } from "next/server";
import { SearchResponse } from "@/lib/types";
import { applyScoring } from "@/lib/scorer";
import { fetchTED, fetchANAC, fetchRegioneER, fetchGSE, fetchInvitalia } from "@/lib/sources";

const SOURCE_FN: Record<string, () => Promise<ReturnType<typeof fetchANAC>> | ReturnType<typeof fetchANAC>> = {
  TED: fetchTED,
  ANAC: fetchANAC,
  "Regione ER": fetchRegioneER,
  GSE: fetchGSE,
  Invitalia: fetchInvitalia,
};

export async function POST(req: NextRequest) {
  try {
    const { sources = ["TED", "ANAC", "Regione ER", "GSE", "Invitalia"], minAmount = 0 } = await req.json();

    const results = await Promise.allSettled(
      sources.map((s: string) => SOURCE_FN[s]?.() ?? Promise.resolve([]))
    );

    const allTenders = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
    const unique = Array.from(new Map(allTenders.map((t) => [t.id, t])).values());
    const { scored } = applyScoring(unique);

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
