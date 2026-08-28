import { LengthUnit } from "@/types/project";

const MM_PER_INCH = 25.4;
const MM_PER_FOOT = MM_PER_INCH * 12;
const MM_PER_METRE = 1000;

export function mmToFeetInches(mm: number): string {
  const totalInches = mm / MM_PER_INCH;
  const sign = totalInches < 0 ? "-" : "";
  const abs = Math.abs(totalInches);
  let feet = Math.floor(abs / 12);
  let inches = Math.round((abs - feet * 12) * 8) / 8; // nearest 1/8"
  if (inches >= 12) {
    feet += 1;
    inches -= 12;
  }
  const inchesStr = formatFraction(inches);
  return `${sign}${feet}'-${inchesStr}"`;
}

function formatFraction(inches: number): string {
  const whole = Math.floor(inches);
  const frac = inches - whole;
  const eighths = Math.round(frac * 8);
  if (eighths === 0) return `${whole}`;
  if (eighths === 8) return `${whole + 1}`;
  const fracStrings: Record<number, string> = {
    1: "1/8",
    2: "1/4",
    3: "3/8",
    4: "1/2",
    5: "5/8",
    6: "3/4",
    7: "7/8",
  };
  return whole === 0 ? fracStrings[eighths] : `${whole} ${fracStrings[eighths]}`;
}

export function mmToMetres(mm: number): string {
  return `${(mm / MM_PER_METRE).toFixed(3)} m`;
}

export function mmToMillimetres(mm: number): string {
  return `${Math.round(mm)} mm`;
}

export function formatLength(mm: number, unit: LengthUnit): string {
  switch (unit) {
    case "ft-in":
      return mmToFeetInches(mm);
    case "m":
      return mmToMetres(mm);
    case "mm":
      return mmToMillimetres(mm);
  }
}

/**
 * Parse user-entered length text in the given preferred unit, but tolerant of
 * mixed input, e.g. "12'-6"", "12ft 6in", "3810mm", "3.81m", "18" (feet if unit is ft-in).
 * Returns mm, or null if unparseable.
 */
export function parseLength(input: string, preferredUnit: LengthUnit): number | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  // millimetres: "3810mm" or "3810 mm"
  let m = text.match(/^(-?\d+(\.\d+)?)\s*mm$/);
  if (m) return parseFloat(m[1]);

  // metres: "3.81m" or "3.81 m"
  m = text.match(/^(-?\d+(\.\d+)?)\s*m$/);
  if (m) return parseFloat(m[1]) * MM_PER_METRE;

  // feet-inches: 12'-6", 12' 6", 12ft 6in, 12'6, 12
  m = text.match(
    /^(-?\d+(\.\d+)?)\s*(?:'|ft)?\s*-?\s*(\d+(\.\d+)?(?:\/\d+)?)?\s*(?:"|in)?$/
  );
  if (m) {
    const feet = parseFloat(m[1]);
    let inches = 0;
    if (m[3]) {
      if (m[3].includes("/")) {
        const [num, den] = m[3].split("/").map(Number);
        inches = num / den;
      } else {
        inches = parseFloat(m[3]);
      }
    }
    const totalFeet = feet < 0 ? feet - inches / 12 : feet + inches / 12;
    if (preferredUnit === "ft-in" || text.includes("'") || text.includes("ft")) {
      return totalFeet * MM_PER_FOOT;
    }
  }

  // bare number: interpret using preferred unit
  const bare = parseFloat(text);
  if (!Number.isNaN(bare)) {
    if (preferredUnit === "mm") return bare;
    if (preferredUnit === "m") return bare * MM_PER_METRE;
    return bare * MM_PER_FOOT; // ft-in bare number = feet
  }

  return null;
}

export function mmToSqFt(areaMm2: number): number {
  const mm2PerFt2 = MM_PER_FOOT * MM_PER_FOOT;
  return areaMm2 / mm2PerFt2;
}

export function mmToSqM(areaMm2: number): number {
  return areaMm2 / (MM_PER_METRE * MM_PER_METRE);
}

export { MM_PER_INCH, MM_PER_FOOT, MM_PER_METRE };
