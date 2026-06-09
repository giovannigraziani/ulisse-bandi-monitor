import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tender } from "./types";
import { COMPANY_PROFILE } from "./companyProfile";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Prompt compatto — meno token = meno latenza, più nel free tier
const PROMPT_PREFIX = `
Analizza questi bandi pubblici italiani per un'azienda di impiantistica (elettrica, fotovoltaico, termoidraulica).

PROFILO BREVE:
${COMPANY_PROFILE}

Per ogni bando restituisci SOLO JSON array. Nessun testo aggiuntivo.
Schema: [{"id":"...","score":0-100,"compatibilita":"Alta compatibilità"|"Media compatibilità"|"Da valutare","tagCategoria":"Impianti elettrici"|"Fotovoltaico"|"Termoidraulica"|"Pubblica illuminazione"|"Efficienza energetica"|"CER"|"Manutenzione"|"Altro","perche_rilevante":"frase breve","requisiti_chiave":["max 3 voci"]}]

BANDI:
`;

export async function enrichWithGemini(
  tenders: Pick<Tender, "id" | "titolo" | "descrizione" | "fonte" | "importo" | "scadenza">[]
): Promise<
  {
    id: string;
    score: number;
    compatibilita: Tender["compatibilita"];
    tagCategoria: string;
    perche_rilevante: string;
    requisiti_chiave: string[];
  }[]
> {
  if (tenders.length === 0) return [];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1, // bassa per output deterministico
      maxOutputTokens: 2048,
    },
  });

  const input = JSON.stringify(
    tenders.map((t) => ({
      id: t.id,
      titolo: t.titolo,
      descrizione: t.descrizione.substring(0, 300),
      importo: t.importo,
    }))
  );

  const result = await model.generateContent(PROMPT_PREFIX + input);
  const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Gemini parse error:", text.substring(0, 200));
    return tenders.map((t) => ({
      id: t.id,
      score: 30,
      compatibilita: "Da valutare" as const,
      tagCategoria: "Altro",
      perche_rilevante: "Analisi AI non disponibile — verifica manuale",
      requisiti_chiave: ["Verifica bando originale"],
    }));
  }
}
