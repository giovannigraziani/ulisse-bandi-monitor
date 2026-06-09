import { RawTender, Tender } from "./types";

// CPV → categoria interna + punteggio base
const CPV_RULES: { prefix: string; categoria: string; points: number }[] = [
  { prefix: "45310", categoria: "Impianti elettrici", points: 35 },
  { prefix: "45315", categoria: "Impianti elettrici", points: 35 },
  { prefix: "45316", categoria: "Pubblica illuminazione", points: 35 },
  { prefix: "09331", categoria: "Fotovoltaico", points: 35 },
  { prefix: "45261215", categoria: "Fotovoltaico", points: 35 },
  { prefix: "45331", categoria: "Termoidraulica", points: 30 },
  { prefix: "45332", categoria: "Termoidraulica", points: 28 },
  { prefix: "50711", categoria: "Manutenzione", points: 30 },
  { prefix: "71314", categoria: "Efficienza energetica", points: 25 },
  { prefix: "45261", categoria: "Fotovoltaico", points: 20 },
  { prefix: "45300", categoria: "Impianti elettrici", points: 20 },
  { prefix: "45320", categoria: "Efficienza energetica", points: 15 },
  { prefix: "45400", categoria: "Impianti elettrici", points: 10 },
];

// NUTS Emilia-Romagna → bonus geografico
const ER_NUTS = ["ITH5", "ITH57", "ITH58", "ITH59", "ITH55", "ITH56", "ITH5A"];

// Keyword nel titolo/descrizione → bonus
const KEYWORD_RULES: { pattern: RegExp; points: number; categoria?: string }[] = [
  { pattern: /fotovoltai|pannell.{0,5}solar|solare.{0,10}termico|CER|comunità energetic/i, points: 20, categoria: "Fotovoltaico" },
  { pattern: /illuminazion|pubblica.{0,10}illuminaz|LED|smart.{0,5}light/i, points: 20, categoria: "Pubblica illuminazione" },
  { pattern: /impianto.{0,10}elettr|impianti.{0,10}elettr|installaz.{0,10}elettr/i, points: 18, categoria: "Impianti elettrici" },
  { pattern: /termico|riscaldamento|climatizzaz|pompa.{0,5}calore|HVAC/i, points: 18, categoria: "Termoidraulica" },
  { pattern: /manutenzione.{0,20}impianti|gestione.{0,20}impianti/i, points: 15, categoria: "Manutenzione" },
  { pattern: /efficien.{0,10}energ|risparmio.{0,10}energ|riqualificaz.{0,10}energ/i, points: 15, categoria: "Efficienza energetica" },
  { pattern: /PNRR|M2C3|NextGenerationEU/i, points: 10 },
  { pattern: /idraulic|impianto.{0,10}idraulic|scarico|fognatura/i, points: 12, categoria: "Termoidraulica" },
  { pattern: /antincendio|sprinkler|rilevazione.{0,10}incendio/i, points: 10, categoria: "Impianti elettrici" },
  { pattern: /cablaggio|fibra.{0,5}ottica|rete.{0,10}dati|telecomunicaz/i, points: 8, categoria: "Impianti elettrici" },
  { pattern: /emilia.{0,10}romagna|forl|cesena|ravenna|rimini|bologna/i, points: 15 },
];

// Importo ottimale per Angelini: 100k-5M
function importoScore(amount: number): number {
  if (amount === 0) return 5; // sconosciuto, non penalizzare
  if (amount < 50000) return 0;
  if (amount < 100000) return 5;
  if (amount <= 5000000) return 15;
  if (amount <= 10000000) return 8;
  return 3; // troppo grande per una PMI da 60 dip.
}

export interface ScoringResult {
  score: number;
  compatibilita: "Alta compatibilità" | "Media compatibilità" | "Da valutare";
  tagCategoria: string;
  requisiti_chiave: string[];
  perche_rilevante: string;
  needsAI: boolean; // true se non abbiamo abbastanza segnali deterministici
}

export function scoreDetterministico(tender: RawTender): ScoringResult {
  let score = 0;
  let categoria = "Altro";
  let hasCpvMatch = false;
  const signals: string[] = [];

  // 1. CPV matching
  for (const cpv of tender.cpvCodes) {
    for (const rule of CPV_RULES) {
      if (cpv.startsWith(rule.prefix)) {
        score += rule.points;
        if (!hasCpvMatch) categoria = rule.categoria;
        hasCpvMatch = true;
        signals.push(`CPV ${cpv} (${rule.categoria})`);
        break;
      }
    }
  }

  // 2. NUTS geografico
  const text = `${tender.titolo} ${tender.descrizione} ${tender.stazioneAppaltante}`.toLowerCase();
  const isER = ER_NUTS.some((n) => tender.descrizione?.includes(n) || tender.titolo?.includes(n));
  if (isER) {
    score += 20;
    signals.push("Localizzato in Emilia-Romagna");
  }

  // 3. Keyword nel testo
  let keywordCategoria = "";
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(tender.titolo) || rule.pattern.test(tender.descrizione)) {
      score += rule.points;
      if (rule.categoria && !hasCpvMatch && !keywordCategoria) {
        keywordCategoria = rule.categoria;
      }
    }
  }
  if (keywordCategoria && categoria === "Altro") categoria = keywordCategoria;

  // 4. Importo
  const imp = importoScore(tender.importoNumerico);
  score += imp;

  // 5. Fonte bonus (GSE/Invitalia sono sempre rilevanti per Angelini)
  if (tender.fonte === "GSE") {
    score += 15;
    if (categoria === "Altro") categoria = "Efficienza energetica";
  }
  if (tender.fonte === "Invitalia") score += 8;

  // Cap a 100
  score = Math.min(100, score);

  const compatibilita: ScoringResult["compatibilita"] =
    score >= 70 ? "Alta compatibilità" :
    score >= 40 ? "Media compatibilità" :
    "Da valutare";

  // Requisiti chiave deterministici
  const requisiti_chiave: string[] = [];
  if (tender.importo && tender.importo !== "N/D") requisiti_chiave.push(`Importo base: ${tender.importo}`);
  if (tender.scadenza && tender.scadenza !== "N/D") requisiti_chiave.push(`Scadenza: ${tender.scadenza}`);
  if (tender.cpvCodes.length > 0) requisiti_chiave.push(`CPV: ${tender.cpvCodes.slice(0, 2).join(", ")}`);
  if (requisiti_chiave.length < 3 && tender.stazioneAppaltante !== "N/D") {
    requisiti_chiave.push(`Ente: ${tender.stazioneAppaltante}`);
  }

  // Frase rilevanza template
  const perche_rilevante = buildRelevancePhrase(tender, categoria, score);

  // Serve AI solo se il testo è molto ambiguo (no CPV e score basso)
  const needsAI = !hasCpvMatch && score < 40 && tender.descrizione.length > 20;

  return { score, compatibilita, tagCategoria: categoria, requisiti_chiave, perche_rilevante, needsAI };
}

function buildRelevancePhrase(tender: RawTender, categoria: string, score: number): string {
  const province = ["Forlì", "Cesena", "Ravenna", "Rimini", "Bologna", "Emilia", "Romagna"];
  const isLocal = province.some((p) =>
    tender.titolo.includes(p) || tender.stazioneAppaltante.includes(p)
  );

  const localTag = isLocal ? " in area di riferimento (ER)" : "";

  const categoriaFrasi: Record<string, string> = {
    "Impianti elettrici": `Rientra nelle categorie SOA OG10/OG11${localTag}.`,
    "Fotovoltaico": `Compatibile con categoria SOA OG9 (fotovoltaico/solare)${localTag}.`,
    "Pubblica illuminazione": `Allineato alle attività di pubblica illuminazione LED/smart${localTag}.`,
    "Termoidraulica": `Rientra nella categoria SOA OS28 (impianti termici)${localTag}.`,
    "Manutenzione": `Servizio continuativo su impianti, attività consolidata per Angelini${localTag}.`,
    "Efficienza energetica": `Bando PNRR/incentivo per efficienza energetica, settore strategico${localTag}.`,
    "CER": `Comunità Energetica: alta priorità per expertise fotovoltaica${localTag}.`,
    "Altro": score >= 50 ? `Potenzialmente rilevante — valutare i dettagli del bando${localTag}.` : `Compatibilità limitata con il profilo aziendale${localTag}.`,
  };

  return categoriaFrasi[categoria] ?? categoriaFrasi["Altro"];
}

export function applyScoring(tenders: RawTender[]): {
  scored: Omit<Tender, never>[];
  needAIIds: string[];
} {
  const scored: Tender[] = [];
  const needAIIds: string[] = [];

  for (const t of tenders) {
    const result = scoreDetterministico(t);
    scored.push({
      ...t,
      compatibilita: result.compatibilita,
      score: result.score,
      tagCategoria: result.tagCategoria,
      categoria: result.tagCategoria,
      requisiti_chiave: result.requisiti_chiave,
      perche_rilevante: result.perche_rilevante,
    });
    if (result.needsAI) needAIIds.push(t.id);
  }

  return { scored, needAIIds };
}
