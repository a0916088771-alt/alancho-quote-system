import type { Quote } from "./quote-types";

export const quoteStorageKey = "alancho_quote_history_v1";

export function readQuoteHistory(): Quote[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(quoteStorageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(quoteStorageKey);
    return [];
  }
}

export function writeQuoteHistory(history: Quote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(quoteStorageKey, JSON.stringify(history));
}
