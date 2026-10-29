// Display helpers. All money is stored and calculated as integer cents (CLAUDE.md rule 4);
// formatting to euros only happens here, at display time.

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export function formatEuro(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatEuro expects integer cents, got ${cents}`);
  }
  // Intl uses a narrow no-break space after the euro sign; normalise to a regular space.
  return euro.format(cents / 100).replace(/ /g, " ");
}

/** Dutch decimal notation, e.g. 43.2 -> "43,2". */
export function formatNumber(value: number, maxDecimals = 2): string {
  return new Intl.NumberFormat("nl-NL", { maximumFractionDigits: maxDecimals }).format(value);
}
