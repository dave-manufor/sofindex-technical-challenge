/**
 * Egyptian phone number validation and formatting.
 *
 * Handles:
 * - Mobile numbers: 01x xxxxxxxx (11 digits) → +201xxxxxxxxx
 * - Cairo landlines: 02 xxxxxxxx (10 digits) → +202xxxxxxxx
 * - Other landlines: 0XX xxxxxxx (10 digits) → +20XXxxxxxxx
 * - Numbers already prefixed with country code 20
 */

import { logger } from "./logger.js";

/**
 * Validates and formats an Egyptian phone number to international format.
 * @param raw - Raw phone string from scraper
 * @returns Formatted number like +201xxxxxxxxx, or null if invalid
 */
export function formatEgyptianPhone(raw: string | undefined): string | null {
  if (!raw) return null;

  // Strip all non-digit characters
  let digits = raw.replace(/\D/g, "");

  // Handle country code prefix
  if (digits.startsWith("002")) {
    // International dialing format: 002 0xx...
    digits = digits.slice(2);
  } else if (digits.startsWith("20") && !digits.startsWith("0")) {
    // Already has country code: 201xxxxxxxxx
    digits = "0" + digits.slice(2);
  }

  // Now digits should start with 0
  if (!digits.startsWith("0")) {
    logger.warn(`Invalid Egyptian phone (no leading 0): ${raw}`);
    return null;
  }

  // Mobile numbers: 01[0-9] followed by 8 digits = 11 digits total
  if (/^01[0-9]\d{8}$/.test(digits)) {
    return `+2${digits}`;
  }

  // Cairo landline: 02 followed by 8 digits = 10 digits total
  if (/^02\d{8}$/.test(digits)) {
    return `+2${digits}`;
  }

  // Other area codes: 0[3-9]X followed by 7 digits = 10 digits total
  if (/^0[3-9]\d{8}$/.test(digits)) {
    return `+2${digits}`;
  }

  logger.warn(
    `Could not validate Egyptian phone number: ${raw} (digits: ${digits})`,
  );
  return null;
}

/**
 * Checks whether a raw phone string contains a potentially valid number.
 * More lenient than formatEgyptianPhone — used to decide if a place has contact info.
 */
export function hasPhoneNumber(raw: string | undefined): boolean {
  if (!raw) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8;
}
