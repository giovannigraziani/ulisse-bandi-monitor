export interface Tender {
  id: string;
  titolo: string;
  fonte: "TED" | "ANAC" | "Regione ER" | "GSE" | "Invitalia";
  importo: string;
  importoNumerico: number;
  scadenza: string;
  stazioneAppaltante: string;
  categoria: string;
  cpvCodes: string[];
  descrizione: string;
  linkOriginale: string;
  // Added by Claude
  compatibilita: "Alta compatibilità" | "Media compatibilità" | "Da valutare";
  score: number;
  requisiti_chiave: string[];
  perche_rilevante: string;
  tagCategoria: string;
}

export interface RawTender {
  id: string;
  titolo: string;
  fonte: "TED" | "ANAC" | "Regione ER" | "GSE" | "Invitalia";
  importo: string;
  importoNumerico: number;
  scadenza: string;
  stazioneAppaltante: string;
  cpvCodes: string[];
  descrizione: string;
  linkOriginale: string;
}

export interface SearchConfig {
  cpvCodes: string[];
  nuts: string[];
  keywords: string[];
  categories: string[];
  minAmount: number;
  sources: string[];
}

export interface SourceMeta {
  source: string;
  isReal: boolean;
  error?: string;
  notice?: string;
  portalUrl?: string;
}

export interface SearchResponse {
  tenders: Tender[];
  lastUpdated: string;
  sourceErrors: { source: string; error: string }[];
  sourceMeta: SourceMeta[];
  totalFound: number;
}

export interface AlertConfig {
  email: string;
  tenders: Tender[];
}
