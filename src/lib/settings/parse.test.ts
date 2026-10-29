import { describe, expect, it } from "vitest";
import {
  centsToInput,
  isValidDutchVatNumber,
  isValidIban,
  isValidKvk,
  normalizePostalCode,
  numberToInput,
  parseDutchNumber,
  parseEuroToCents,
  parsePercentToBp,
} from "./parse";

describe("parseEuroToCents", () => {
  it("understands how painters type amounts", () => {
    expect(parseEuroToCents("45")).toBe(4500);
    expect(parseEuroToCents("45,5")).toBe(4550);
    expect(parseEuroToCents("45,50")).toBe(4550);
    expect(parseEuroToCents("€ 45,50")).toBe(4550);
    expect(parseEuroToCents("€1.234,56")).toBe(123456);
    expect(parseEuroToCents("1.234")).toBe(123400);
    expect(parseEuroToCents("12.5")).toBe(1250);
    expect(parseEuroToCents("0,10")).toBe(10);
  });

  it("rejects what it cannot understand instead of guessing", () => {
    expect(parseEuroToCents("")).toBeNull();
    expect(parseEuroToCents("vijftig")).toBeNull();
    expect(parseEuroToCents("45,555")).toBeNull();
    expect(parseEuroToCents("4,5,0")).toBeNull();
  });
});

describe("parseDutchNumber", () => {
  it("reads decimals with a comma", () => {
    expect(parseDutchNumber("0,75")).toBe(0.75);
    expect(parseDutchNumber("18")).toBe(18);
    expect(parseDutchNumber("2,6")).toBe(2.6);
  });
});

describe("parsePercentToBp", () => {
  it("converts percentages to basis points", () => {
    expect(parsePercentToBp("15")).toBe(1500);
    expect(parsePercentToBp("15%")).toBe(1500);
    expect(parsePercentToBp("12,5")).toBe(1250);
  });
});

describe("input formatting", () => {
  it("formats values back for input fields", () => {
    expect(centsToInput(4550)).toBe("45,50");
    expect(centsToInput(null)).toBe("");
    expect(numberToInput(0.75)).toBe("0,75");
  });
});

describe("checks", () => {
  it("validates IBANs with the mod-97 check", () => {
    expect(isValidIban("NL91 ABNA 0417 1643 00")).toBe(true);
    expect(isValidIban("NL91ABNA0417164301")).toBe(false);
    expect(isValidIban("NL91ABNA041716430")).toBe(false);
    expect(isValidIban("DE89 3704 0044 0532 0130 00")).toBe(true);
  });

  it("validates KVK and VAT numbers", () => {
    expect(isValidKvk("12345678")).toBe(true);
    expect(isValidKvk("1234567")).toBe(false);
    expect(isValidDutchVatNumber("NL123456789B01")).toBe(true);
    expect(isValidDutchVatNumber("nl 1234.56.789.B01")).toBe(true);
    expect(isValidDutchVatNumber("NL123456789")).toBe(false);
  });

  it("normalizes postal codes", () => {
    expect(normalizePostalCode("1234ab")).toBe("1234 AB");
    expect(normalizePostalCode("1234 AB")).toBe("1234 AB");
    expect(normalizePostalCode("0123 AB")).toBeNull();
    expect(normalizePostalCode("12345")).toBeNull();
  });
});
