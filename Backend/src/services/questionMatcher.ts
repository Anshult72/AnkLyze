/**
 * ANKLYZE Phase 9 - Deterministic Question Detection & Matcher
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Detects question number patterns from OCR text and bounding layout.
 * - Normalizes handwriting variants: Q1, Q.3, Question 4, 4., 4), Ans 4, 5(a), etc.
 * - Matches candidates against the canonical Question structure from the database.
 * - Never invents questions; the exam question structure is the source of truth.
 * - Distinguishes blank answers, cancellations, and unreadable scans cleanly.
 */

import { OCRBlock } from '../ocr/types';

export interface DetectedQuestionMarker {
  rawText: string;
  normalizedLabel: string;
  candidateTokens: string[];
  blockIndex?: number;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface QuestionMatchResult {
  matchedQuestionId?: string;
  matchedQuestionNumber?: string;
  detectedMarker?: DetectedQuestionMarker;
  confidence: number;
  isAmbiguous: boolean;
  ambiguityReason?: string;
}

export interface ExamQuestionReference {
  id: string;
  questionNumber: string; // e.g. "Q01", "Q04", "1(a)", "4"
  questionText: string;
  maximumMarks: number;
}

export class QuestionMatcher {
  // Regex pattern matching question markers across diverse handwriting/OCR styles
  // Handles: "Q1", "Q. 1", "Question 2", "Ans. 3", "Answer 4", "4.", "4)", "5(a)", "Q5(b)", etc.
  private static readonly QUESTION_MARKER_REGEX =
    /(?:(?:^|\n|\r)\s*(?:Q(?:uestion)?\.?\s*(\d+)(?:\s*[\(\[]?([a-zA-Z])[\)\]]?)?|Ans(?:wer)?\.?\s*(\d+)(?:\s*[\(\[]?([a-zA-Z])[\)\]]?)?|([1-9]\d*)\s*[\.\)\-:]\s*(?:\(?([a-zA-Z])\)?)?))|(?:(?:\s+)(?:Q(?:uestion)?\.?\s*(\d+)(?:\s*[\(\[]?([a-zA-Z])[\)\]]?)?|Ans(?:wer)?\.?\s*(\d+)(?:\s*[\(\[]?([a-zA-Z])[\)\]]?)?))/gi;

  private static readonly CANCELLATION_REGEX =
    /\b(CANCELLED|CANCELED|CANCEL|WRONG|DO\s+NOT\s+EVALUATE|IGNORE\s+THIS|STRUCK\s+OUT|XXXX+)\b/i;

  /**
   * Scans text and OCR blocks on a single page to detect candidate question markers.
   */
  public static detectMarkersOnPage(
    fullText: string,
    blocks: OCRBlock[] = []
  ): DetectedQuestionMarker[] {
    const markers: DetectedQuestionMarker[] = [];
    const seenLabels = new Set<string>();

    // 1. Scan fullText for regex matches
    const textToScan = fullText || '';
    let match: RegExpExecArray | null;

    // Reset regex index
    this.QUESTION_MARKER_REGEX.lastIndex = 0;

    while ((match = this.QUESTION_MARKER_REGEX.exec(textToScan)) !== null) {
      const rawMatch = match[0].trim();
      const mainNum = match[1] || match[3] || match[5] || match[7] || match[9];
      const subPart = (match[2] || match[4] || match[6] || match[8] || match[10] || '').toLowerCase();

      if (!mainNum || mainNum === '0') continue;

      const normalizedTokens = this.generateNormalizedTokens(mainNum, subPart);
      const primaryLabel = subPart ? `Q${mainNum}(${subPart})` : `Q${mainNum}`;

      if (!seenLabels.has(primaryLabel)) {
        seenLabels.add(primaryLabel);

        // Best-effort bounding box correlation from blocks
        const matchingBlock = blocks.find((b) =>
          b.text && b.text.toLowerCase().includes(rawMatch.toLowerCase())
        );

        markers.push({
          rawText: rawMatch,
          normalizedLabel: primaryLabel,
          candidateTokens: normalizedTokens,
          confidence: matchingBlock ? Math.min(1.0, matchingBlock.confidence + 0.05) : 0.88,
          boundingBox: matchingBlock?.boundingBox,
        });
      }
    }

    return markers;
  }

  /**
   * Generates candidate lookup tokens for fuzzy matching against DB questions.
   * e.g., "4" -> ["Q04", "Q4", "4", "QUESTION 4", "04"]
   * e.g., "5", "a" -> ["Q05(a)", "Q5(a)", "5(a)", "5A", "Q5A"]
   */
  public static generateNormalizedTokens(mainNum: string, subPart: string = ''): string[] {
    const numInt = parseInt(mainNum, 10);
    const padded = isNaN(numInt) ? mainNum : numInt < 10 ? `0${numInt}` : `${numInt}`;
    const cleanNum = isNaN(numInt) ? mainNum : `${numInt}`;

    const tokens = new Set<string>();

    if (subPart) {
      const spLower = subPart.toLowerCase();
      const spUpper = subPart.toUpperCase();
      tokens.add(`Q${cleanNum}(${spLower})`);
      tokens.add(`Q${padded}(${spLower})`);
      tokens.add(`Q${cleanNum}${spLower}`);
      tokens.add(`Q${cleanNum}${spUpper}`);
      tokens.add(`${cleanNum}(${spLower})`);
      tokens.add(`${cleanNum}${spLower}`);
      tokens.add(`${cleanNum}${spUpper}`);
    } else {
      tokens.add(`Q${cleanNum}`);
      tokens.add(`Q${padded}`);
      tokens.add(`${cleanNum}`);
      tokens.add(`${padded}`);
      tokens.add(`Question ${cleanNum}`);
      tokens.add(`Ans ${cleanNum}`);
    }

    return Array.from(tokens);
  }

  /**
   * Matches a detected marker against the exam's canonical questions.
   */
  public static matchMarkerToQuestions(
    marker: DetectedQuestionMarker,
    examQuestions: ExamQuestionReference[]
  ): QuestionMatchResult {
    const normalizedMarkerTokens = new Set(
      marker.candidateTokens.map((t) => t.toLowerCase().replace(/[\s\.\)\(\-:]/g, ''))
    );

    const matches: ExamQuestionReference[] = [];

    for (const q of examQuestions) {
      const parsedMatch = q.questionNumber.match(/^Q?(\d+)(?:\(?([a-zA-Z])\)?)?$/i);
      const qNum = parsedMatch ? parsedMatch[1] : q.questionNumber.replace(/\D/g, '');
      const qSub = parsedMatch && parsedMatch[2] ? parsedMatch[2].toLowerCase() : '';

      const qTokens = [
        q.questionNumber,
        ...this.generateNormalizedTokens(qNum || q.questionNumber, qSub),
      ].map((t) => t.toLowerCase().replace(/[\s\.\)\(\-:]/g, ''));

      for (const token of qTokens) {
        if (normalizedMarkerTokens.has(token)) {
          matches.push(q);
          break;
        }
      }
    }

    if (matches.length === 1) {
      return {
        matchedQuestionId: matches[0].id,
        matchedQuestionNumber: matches[0].questionNumber,
        detectedMarker: marker,
        confidence: marker.confidence,
        isAmbiguous: false,
      };
    }

    if (matches.length > 1) {
      return {
        matchedQuestionId: matches[0].id,
        matchedQuestionNumber: matches[0].questionNumber,
        detectedMarker: marker,
        confidence: 0.60,
        isAmbiguous: true,
        ambiguityReason: `Detected label '${marker.rawText}' matches multiple exam questions: [${matches.map((m) => m.questionNumber).join(', ')}]`,
      };
    }

    return {
      detectedMarker: marker,
      confidence: 0.40,
      isAmbiguous: true,
      ambiguityReason: `Detected label '${marker.rawText}' does not match any registered exam question`,
    };
  }

  /**
   * Detects if an answer region is BLANK.
   * Evidence: Question identifier is present, but no meaningful answer text exists.
   * (Crucial: Low OCR confidence is NOT blank!)
   */
  public static isBlankAnswer(
    fullText: string,
    markerText?: string,
    qualityScore: number = 1.0,
    ocrConfidence: number = 0.9
  ): boolean {
    // If image quality or OCR confidence is poor, we cannot declare blank
    if (qualityScore < 0.4 || ocrConfidence < 0.4) {
      return false;
    }

    const stripped = fullText
      .replace(markerText || '', '')
      .replace(/page\s*\d+/gi, '')
      .replace(/[\s\r\n\t\.\-_=]/g, '');

    // If remaining substantive characters are fewer than 10, it's strongly blank
    return stripped.length < 10;
  }

  /**
   * Detects obvious cancellation indicators in the page text or layout.
   */
  public static isCancelledAnswer(
    fullText: string,
    _blocks: OCRBlock[] = []
  ): { isCancelled: boolean; isAmbiguous: boolean; reason?: string } {
    if (this.CANCELLATION_REGEX.test(fullText)) {
      const match = fullText.match(this.CANCELLATION_REGEX);
      return {
        isCancelled: true,
        isAmbiguous: false,
        reason: `Explicit cancellation keyword '${match ? match[0] : 'CANCELLED'}' detected in text`,
      };
    }

    // Check for repetitive large strikethroughs: e.g. "XXXXXXX" or "/////"
    if (/(?:X{4,}|\/{5,}|\\{5,}|-{8,})/i.test(fullText)) {
      return {
        isCancelled: true,
        isAmbiguous: false,
        reason: 'Visual strike-through / cross-out symbol sequence detected',
      };
    }

    return {
      isCancelled: false,
      isAmbiguous: false,
    };
  }

  /**
   * Detects if a page / answer is UNREADABLE.
   * Takes into account qualityScore, OCR confidence, and scan integrity.
   */
  public static isUnreadable(
    qualityScore?: number,
    confidence?: number,
    fullText?: string
  ): boolean {
    const qScore = qualityScore ?? 1.0;
    const conf = confidence ?? 1.0;

    // Severe blur or scan degradation combined with very low OCR confidence
    if (qScore < 0.3 && conf < 0.35) {
      return true;
    }

    // If text is essentially garbage/unrecognized control characters
    if (conf < 0.25 && (fullText || '').length > 20) {
      return true;
    }

    return false;
  }
}
