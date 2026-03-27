/**
 * Normalizes a Venezuelan CI (cédula de identidad) to format: V12345678
 *
 * Accepts:
 *  - V12345678
 *  - v12345678
 *  - 12345678
 *  - V-12345678
 *  - v-12.345.678
 *  - E12345678 (extranjeros)
 *
 * Returns normalized string like V12345678 or E12345678
 * Returns null if the input is not a valid CI after normalization.
 */
export function normalizeCi(raw: string): string | null {
  // Trim and remove spaces
  let cleaned = raw.trim().replace(/\s+/g, "");

  // Remove dashes and dots
  cleaned = cleaned.replace(/[-./]/g, "");

  // Uppercase
  cleaned = cleaned.toUpperCase();

  // If it starts with a digit, prepend V
  if (/^\d/.test(cleaned)) {
    cleaned = "V" + cleaned;
  }

  // Must match: V or E followed by 6-10 digits
  const CI_REGEX = /^[VE]\d{6,10}$/;

  if (!CI_REGEX.test(cleaned)) {
    return null;
  }

  return cleaned;
}
