import Anthropic from "@anthropic-ai/sdk";
import { RawTender, Tender } from "./types";
import { COMPANY_PROFILE } from "./companyProfile";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SCORING_PROMPT = `
Sei un agente AI specializzato nell'analisi di bandi pubblici per conto di un'azienda di impiantistica.

PROFILO AZIENDA:
${COMPANY_PROFILE}

Ricevi una lista di bandi pubblici in formato JSON. Per ognuno devi:
1. Assegnare un punteggio di compatibilità (0-100) basato su quanto il bando si adatta al profilo aziendale
2. Classificare in: "Alta compatibilità" (score ≥ 70), "Media compatibilità" (score 40-69), "Da valutare" (score < 40)
3. Estrarre i 3 requisiti chiave più importanti dal titolo e descrizione
4. Spiegare in una frase perché è rilevante per Angelini
5. Assegnare una categoria interna tra: Impianti elettrici / Fotovoltaico / Termoidraulica / Pubblica illuminazione / Efficienza energetica / CER / Manutenzione / Altro

Criteri di scoring:
- Bandi in Emilia-Romagna: +20 punti
- CPV corrispondenti alle categorie SOA: +30 punti
- Importo tra 100k e 5M: +10 punti
- Parole chiave: impianti, elettrico, illuminazione, fotovoltaico, termico, manutenzione: +10 punti ciascuna (max +20)

Rispondi SOLO con array JSON valido. Nessun testo aggiuntivo, nessun markdown.
Schema output: [{"id":"...","compatibilita":"Alta compatibilità","score":85,"requisiti_chiave":["req1","req2","req3"],"perche_rilevante":"...","tagCategoria":"Impianti elettrici"}]

BANDI DA ANALIZZARE:
`;

export async function scoreWithClaude(tenders: RawTender[]): Promise<Tender[]> {
  if (tenders.length === 0) return [];

  // Process in batches of 10 to avoid token limits
  const BATCH_SIZE = 10;
  const results: Tender[] = [];

  for (let i = 0; i < tenders.length; i += BATCH_SIZE) {
    const batch = tenders.slice(i, i + BATCH_SIZE);
    const batchResults = await scoreBatch(batch);
    results.push(...batchResults);
  }

  return results;
}

async function scoreBatch(tenders: RawTender[]): Promise<Tender[]> {
  const tendersJson = JSON.stringify(
    tenders.map((t) => ({
      id: t.id,
      titolo: t.titolo,
      fonte: t.fonte,
      importo: t.importo,
      scadenza: t.scadenza,
      stazioneAppaltante: t.stazioneAppaltante,
      cpvCodes: t.cpvCodes,
      descrizione: t.descrizione.substring(0, 500),
    })),
    null,
    2
  );

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: SCORING_PROMPT + tendersJson,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  let scored: {
    id: string;
    compatibilita: "Alta compatibilità" | "Media compatibilità" | "Da valutare";
    score: number;
    requisiti_chiave: string[];
    perche_rilevante: string;
    tagCategoria: string;
  }[];

  try {
    // Strip any markdown code fences if present
    const text = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    scored = JSON.parse(text);
  } catch {
    console.error("Failed to parse Claude response:", content.text);
    // Fallback: assign default scores
    scored = tenders.map((t) => ({
      id: t.id,
      compatibilita: "Da valutare" as const,
      score: 30,
      requisiti_chiave: ["Verifica manuale richiesta"],
      perche_rilevante: "Analisi AI non disponibile",
      tagCategoria: "Altro",
    }));
  }

  // Merge raw tender data with Claude scoring
  return tenders.map((raw) => {
    const analysis = scored.find((s) => s.id === raw.id);
    return {
      ...raw,
      compatibilita: analysis?.compatibilita ?? "Da valutare",
      score: analysis?.score ?? 0,
      requisiti_chiave: analysis?.requisiti_chiave ?? [],
      perche_rilevante: analysis?.perche_rilevante ?? "",
      tagCategoria: analysis?.tagCategoria ?? "Altro",
      categoria: analysis?.tagCategoria ?? "Altro",
    };
  });
}
