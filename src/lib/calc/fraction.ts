// Exact arithmetic with fractions of BigInts. Floating point numbers cannot represent values like 0.1
// exactly, which leads to rounding errors in money. All calculations go through these helpers and are
// only rounded at clearly defined points (see README.md in this folder).

export type Fraction = { readonly n: bigint; readonly d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

export function frac(n: bigint | number, d: bigint | number = 1n): Fraction {
  let nb = typeof n === "number" ? toBigInt(n) : n;
  let db = typeof d === "number" ? toBigInt(d) : d;
  if (db === 0n) throw new Error("Division by zero");
  if (db < 0n) [nb, db] = [-nb, -db];
  const g = gcd(nb, db) || 1n;
  return { n: nb / g, d: db / g };
}

function toBigInt(value: number): bigint {
  if (!Number.isInteger(value)) throw new Error(`Expected an integer, got ${value}`);
  return BigInt(value);
}

/** Converts a decimal input such as 2.6 to an exact fraction, keeping at most 3 decimals (e.g. millimetres). */
export function fromDecimal(value: number): Fraction {
  if (!Number.isFinite(value)) throw new Error(`Not a finite number: ${value}`);
  return frac(BigInt(Math.round(value * 1000)), 1000n);
}

export const add = (a: Fraction, b: Fraction) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Fraction, b: Fraction) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Fraction, b: Fraction) => frac(a.n * b.n, a.d * b.d);
export const div = (a: Fraction, b: Fraction) => frac(a.n * b.d, a.d * b.n);

/** Rounds to the nearest integer; exact halves are rounded away from zero (0.5 -> 1, -0.5 -> -1). */
export function roundHalfUp(f: Fraction): number {
  const abs = f.n < 0n ? -f.n : f.n;
  const rounded = (2n * abs + f.d) / (2n * f.d);
  return Number(f.n < 0n ? -rounded : rounded);
}

/** Rounds up to the next integer (for whole packages). */
export function ceil(f: Fraction): number {
  const q = f.n / f.d;
  return Number(f.n % f.d !== 0n && f.n > 0n ? q + 1n : q);
}

export const isZero = (f: Fraction) => f.n === 0n;
export const compare = (a: Fraction, b: Fraction) => {
  const diff = a.n * b.d - b.n * a.d;
  return diff < 0n ? -1 : diff > 0n ? 1 : 0;
};

/** Only for display and tests, never for further calculation. */
export const toNumber = (f: Fraction) => Number(f.n) / Number(f.d);
