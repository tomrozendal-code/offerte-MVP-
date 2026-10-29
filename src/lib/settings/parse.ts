// Parsing and checking of what painters type in Dutch, e.g. "€ 1.234,50" or "0,75".
// Returns null when the input cannot be understood; the forms then show a clear message.

/** "45" | "45,5" | "45,50" | "€ 1.234,56" | "1234.56" → cents. */
export function parseEuroToCents(input: string): number | null {
  const n = parseDutchNumber(input.replace(/€/g, ""), 2);
  return n === null ? null : Math.round(n * 100);
}

/**
 * Dutch number: comma as decimal separator, dots as thousands separator.
 * A single dot followed by 1–2 digits ("12.5") is also read as a decimal point, as people type that too.
 */
export function parseDutchNumber(input: string, maxDecimals = 3): number | null {
  let s = input.trim().replace(/\s/g, "");
  if (s === "") return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "1.234" = one thousand two hundred thirty-four
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const decimals = s.split(".")[1]?.length ?? 0;
  if (decimals > maxDecimals) return null;
  return Number(s);
}

/** "15" | "15,5" → basis points (1500 | 1550). */
export function parsePercentToBp(input: string): number | null {
  const n = parseDutchNumber(input.replace(/%/g, ""), 2);
  return n === null ? null : Math.round(n * 100);
}

/** Formats cents for an input field: 4550 → "45,50". */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Formats a number for an input field: 0.75 → "0,75". */
export function numberToInput(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

export function normalizeIban(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

/** Checks an IBAN with the official mod-97 check. */
export function isValidIban(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  if (iban.startsWith("NL") && iban.length !== 18) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  return remainder === 1;
}

/** KVK number: 8 digits. */
export function isValidKvk(input: string): boolean {
  return /^\d{8}$/.test(input.replace(/\s/g, ""));
}

/** Dutch VAT number (btw-id): NL + 9 digits + B + 2 digits, e.g. NL123456789B01. */
export function isValidDutchVatNumber(input: string): boolean {
  return /^NL\d{9}B\d{2}$/.test(input.replace(/[\s.]/g, "").toUpperCase());
}

/** Dutch postal code: "1234 AB" (space optional). Returns the normalized form or null. */
export function normalizePostalCode(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^([1-9]\d{3})\s?([A-Z]{2})$/);
  return m ? `${m[1]} ${m[2]}` : null;
}
