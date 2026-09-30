/**
 * ANKLYZE Phase 7 - Anonymized Script Code Generator
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Generates unique, non-identifying script identifiers (e.g. A-10492)
 * - Purely anonymous - NEVER derived from student names or roll numbers.
 * - Examiner-facing contexts MUST strictly use this identifier.
 */

import crypto from "crypto";

export function generateScriptCode(): string {
  // Generate a random 5-digit number between 10000 and 99999
  const randomNum = crypto.randomInt(10000, 100000);
  return `A-${randomNum}`;
}

export function isValidScriptCode(code: string): boolean {
  return /^A-\d{5,}$/.test(code);
}
