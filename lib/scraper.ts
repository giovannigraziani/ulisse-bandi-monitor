import * as cheerio from "cheerio";

export async function fetchHtml(url: string, timeout = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AngeliniMonitor/1.0; +https://angelini-bandi.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export function parseAmount(text: string): number {
  if (!text) return 0;
  // Remove currency symbols, spaces, and convert Italian number format
  const cleaned = text
    .replace(/[€$£]/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseDate(text: string): string {
  if (!text) return "N/D";
  // Try to extract a date from various formats
  const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${fullYear}`;
  }
  return text.trim();
}

export { cheerio };
