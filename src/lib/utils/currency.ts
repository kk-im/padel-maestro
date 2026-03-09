/**
 * Supported currencies and approximate exchange rates to USD.
 * Rates are updated periodically — these are rough baselines.
 */
export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD" },
  { code: "IDR", symbol: "Rp", label: "IDR" },
  { code: "NZD", symbol: "NZ$", label: "NZD" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "AUD", symbol: "A$", label: "AUD" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

// Approximate rates: 1 unit of currency = X USD
const RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1,
  IDR: 0.000061, // ~16,400 IDR per USD
  NZD: 0.58,
  EUR: 1.08,
  GBP: 1.26,
  AUD: 0.64,
};

/**
 * Convert an amount from a given currency to USD.
 */
export function toUSD(amount: number, from: CurrencyCode): number {
  const rate = RATES_TO_USD[from] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Format a USD amount for display.
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return "";
  return `$${amount.toFixed(2)}`;
}
