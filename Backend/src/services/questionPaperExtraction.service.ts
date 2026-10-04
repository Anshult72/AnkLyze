import { DOMMatrix, ImageData } from "canvas";
import { pdfProcessorService } from "./pdfProcessor.service";
import { ocrService } from "../ocr/ocrService";

export interface PaperPageText { pageNumber: number; text: string; confidence: number }
export interface DraftPaperQuestion {
  questionNumber: string;
  questionText: string;
  maximumMarks: number | null;
  section: string | null;
  pageNumber: number;
  orderIndex: number;
  confidence: number;
}

// Conservative parsing: uncertain marks and question boundaries require human review.
export function parsePaperQuestions(pages: PaperPageText[]): DraftPaperQuestion[] {
  const questions: DraftPaperQuestion[] = [];
  let section: string | null = null;
  let current: DraftPaperQuestion | null = null;
  const flush = () => {
    if (current && current.questionText.trim().length >= 3) questions.push(current);
    current = null;
  };
  for (const page of pages) {
    for (const raw of page.text.split(/\r?\n/)) {
      const line = raw.replace(/\s+/g, " ").trim();
      if (!line) continue;
      if (/^(?:section|part|खंड|भाग)\s*[-:–]?\s*[A-Zअ-ह0-9]/iu.test(line)) {
        flush();
        section = line.slice(0, 120);
        continue;
      }
      const hit = line.match(/^(?:(?:Q(?:uestion)?|प्रश्न)\s*[.:-]?\s*)?([0-9०-९]{1,3}(?:\s*\([a-zA-Zअ-ह0-9]+\))?)\s*[.):-]\s*(.+)$/iu);
      if (hit && hit[2].length >= 3) {
        flush();
        const questionNumber = hit[1].replace(/\s+/g, "");
        const markHit = hit[2].match(/(?:\[\s*(\d+(?:\.\d+)?)\s*\]|\(\s*(\d+(?:\.\d+)?)\s*(?:marks?|अंक)?\s*\)|(?:marks?|अंक)\s*[:=-]?\s*(\d+(?:\.\d+)?))\s*$/iu);
        const maximumMarks = markHit ? Number(markHit[1] || markHit[2] || markHit[3]) : null;
        current = { questionNumber, questionText: markHit ? hit[2].slice(0, markHit.index).trim() : hit[2], maximumMarks,
          section, pageNumber: page.pageNumber, orderIndex: questions.length + 1, confidence: page.confidence };
      } else if (current) {
        current.questionText += ` ${line}`;
        current.confidence = Math.min(current.confidence, page.confidence);
      }
    }
  }
  flush();
  // Repeated numbers can arise from OCR headers or alternate versions; leave only the first
  // candidate for review rather than silently changing authoritative question IDs.
  return questions.filter((question, index, all) =>
    all.findIndex((candidate) => candidate.questionNumber === question.questionNumber) === index);
}

export async function extractPaperPages(buffer: Buffer): Promise<PaperPageText[]> {
  Object.assign(globalThis, { DOMMatrix, ImageData });
  const importPdfJs = new Function("name", "return import(name)") as
    (name: string) => Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")>;
  const pdfjs = await importPdfJs("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, isEvalSupported: false });
  try {
    const document = await task.promise;
    if (document.numPages < 1 || document.numPages > 200) throw new Error("Question paper must have 1–200 pages");
    const pages: PaperPageText[] = [];
    let rendered: Awaited<ReturnType<typeof pdfProcessorService.processPdf>> | undefined;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let line = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        line += `${item.str} `;
        if (item.hasEOL) { lines.push(line.trim()); line = ""; }
      }
      if (line.trim()) lines.push(line.trim());
      let text = lines.join("\n");
      let confidence = 0.9;
      if (text.replace(/\s/g, "").length < 40) {
        rendered ||= await pdfProcessorService.processPdf(buffer);
        const image = rendered.pages[pageNumber - 1];
        const ocr = await ocrService.processPageWithRetry({
          pageNumber, buffer: image.buffer, mimeType: "image/png",
          width: image.width, height: image.height, languageHints: ["hi", "en"],
        });
        if (ocr.provider === "mock" && process.env.NODE_ENV === "production") {
          throw new Error("Real OCR provider required for scanned question papers");
        }
        text = ocr.fullText;
        confidence = ocr.confidence;
      }
      pages.push({ pageNumber, text, confidence });
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
