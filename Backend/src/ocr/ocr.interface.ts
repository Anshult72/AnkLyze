/**
 * ANKLYZE Phase 8 - OCR Provider Interface
 * "Analyse the marks, not just the paper."
 * 
 * Defines standard abstraction for OCR engines (Google Cloud Vision, Mock, etc.)
 */

import { NormalizedPageOCRResult, OCRProcessPageInput } from "./types";

export interface IOCRProvider {
  readonly name: string;
  readonly defaultFeature: string;
  processPage(input: OCRProcessPageInput): Promise<NormalizedPageOCRResult>;
}
