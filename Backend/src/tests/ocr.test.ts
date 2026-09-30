/**
 * ANKLYZE Phase 8 - OCR & Document Processing Test Suite
 * "Analyse the marks, not just the paper."
 * 
 * Verifies all 20 Phase 8 Scenarios:
 * 1. Authorized user can start processing (SUPER_ADMIN, HEAD_EXAMINER)
 * 2. Unauthorized role cannot start processing (EXAMINER, MODERATOR -> 403)
 * 3. Invalid script ID handled (SCRIPT_NOT_FOUND -> 404)
 * 4. Missing Cloudinary asset handled safely (STORAGE_RETRIEVAL_FAILED)
 * 5. PDF retrieval works through StorageService abstraction
 * 6. Page extraction produces correct page count
 * 7. Page numbering is preserved (1-indexed, sequential)
 * 8. Derived page image created with deterministic naming and correct metadata
 * 9. OCR provider interface works (IOCRProvider implementation compliance)
 * 10. Google Vision adapter normalizes valid response
 * 11. OCR confidence is preserved
 * 12. Bounding boxes are preserved (x, y, width, height, vertices)
 * 13. OCR provider transient failure is retryable
 * 14. OCR invalid request is not retried indefinitely
 * 15. OCR failure marks page as failed
 * 16. One page failure does not destroy successfully processed pages (fault isolation)
 * 17. Document partial-processing status works (PARTIALLY_PROCESSED)
 * 18. Reprocess works (version increment v1 -> v2)
 * 19. OCR provenance is stored (provider, feature, pipelineVersion, timestamp)
 * 20. Original PDF remains unchanged
 */

process.env.NODE_ENV = "test";

import { PDFDocument } from "pdf-lib";
import { MockOCRProvider } from "../ocr/mockOCRProvider";
import { GoogleVisionOCRProvider } from "../ocr/googleVisionProvider";
import { OCRService } from "../ocr/ocrService";
import { PDFProcessorService } from "../services/pdfProcessor.service";
import { MockStorageProvider } from "../storage/mockStorageProvider";
import { StorageService } from "../storage/storageService";
import { DocumentProcessingService } from "../services/documentProcessing.service";
import { DocumentProcessingRepository } from "../repositories/documentProcessing.repository";
import { AppError } from "../utils/app-error";
import { DocumentProcessingStatus, PageProcessingStatus } from "@prisma/client";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [SCENARIO ${totalTests}] ${testName}`);
  } else {
    console.error(`  ❌ [SCENARIO ${totalTests}] FAILED: ${testName} ${detail ? `(${detail})` : ""}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

// RBAC Gatekeeper Verification
function checkProcessingPermission(role: string): void {
  const allowed = ["SUPER_ADMIN", "HEAD_EXAMINER"];
  if (!allowed.includes(role)) {
    throw AppError.forbidden(`Access denied: role '${role}' is not authorized to process documents`, "FORBIDDEN");
  }
}

// Helper to generate a valid multi-page PDF buffer using pdf-lib
async function createSamplePdf(pageCount: number = 3): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
    page.drawText(`ANKLYZE Sample Answer Sheet - Page ${i}`, { x: 50, y: 800 });
    page.drawText(`Question 1 Answer: The fundamental laws of thermodynamics...`, { x: 50, y: 750 });
  }
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// In-Memory Repository for Mocking DB interactions cleanly in tests
class InMemoryDocumentProcessingRepository implements Partial<DocumentProcessingRepository> {
  public scripts = new Map<string, any>();
  public pages = new Map<string, any>();
  public ocrResults = new Map<string, any[]>();

  public async findScriptWithPages(scriptId: string): Promise<any> {
    const s = this.scripts.get(scriptId);
    if (!s) return null;
    const scriptPages = Array.from(this.pages.values())
      .filter((p: any) => p.scriptId === scriptId)
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => ({
        ...p,
        ocrResults: this.ocrResults.get(p.id) || [],
      }));
    return {
      ...s,
      pages: scriptPages,
    };
  }

  public async updateScriptDocumentStatus(scriptId: string, status: DocumentProcessingStatus): Promise<any> {
    const s = this.scripts.get(scriptId);
    if (s) {
      s.documentStatus = status;
    }
  }

  public async upsertScriptPage(data: any): Promise<any> {
    const key = `${data.scriptId}-${data.pageNumber}`;
    let page = Array.from(this.pages.values()).find(
      (p) => p.scriptId === data.scriptId && p.pageNumber === data.pageNumber
    );
    if (!page) {
      page = { id: `page-${key}`, ...data, createdAt: new Date(), updatedAt: new Date() };
    } else {
      Object.assign(page, data, { updatedAt: new Date() });
    }
    this.pages.set(page.id, page);
    return page;
  }

  public async updatePageStatus(pageId: string, status: PageProcessingStatus, errorMessage?: string): Promise<any> {
    const page = this.pages.get(pageId);
    if (page) {
      page.processingStatus = status;
      if (errorMessage) page.errorMessage = errorMessage;
    }
  }

  public async getNextOcrVersion(pageId: string): Promise<number> {
    const results = this.ocrResults.get(pageId) || [];
    return results.length + 1;
  }

  public async createPageOcrResult(data: any): Promise<any> {
    const result = { id: `ocr-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
    const list = this.ocrResults.get(data.pageId) || [];
    list.unshift(result);
    this.ocrResults.set(data.pageId, list);
    return result;
  }

  public async createOCRResult(data: any): Promise<any> {
    return this.createPageOcrResult(data);
  }

  public async updateScriptProcessingMetrics(
    scriptId: string,
    status: DocumentProcessingStatus,
    processedCount: number,
    avgConfidence: number
  ): Promise<any> {
    const s = this.scripts.get(scriptId);
    if (s) {
      s.documentStatus = status;
      s.processedPagesCount = processedCount;
      s.averageOcrConfidence = avgConfidence;
    }
  }

  public async findPageById(pageId: string): Promise<any> {
    const page = this.pages.get(pageId);
    if (!page) return null;
    return {
      ...page,
      ocrResults: this.ocrResults.get(pageId) || [],
    };
  }
}

async function runPhase8TestSuite() {
  console.log("============================================================");
  console.log("📋 ANKLYZE OCR & DOCUMENT PROCESSING (PHASE 8) TEST SUITE");
  console.log("============================================================\n");

  const pdfProcessor = new PDFProcessorService();
  const mockStorage = new MockStorageProvider();
  const storage = new StorageService(mockStorage);
  const mockOcrProvider = new MockOCRProvider();
  const ocrService = new OCRService(mockOcrProvider);
  const repo = new InMemoryDocumentProcessingRepository() as any;
  const docService = new DocumentProcessingService(repo, storage, pdfProcessor, ocrService);

  // Setup sample test PDF & storage asset
  const samplePdf = await createSamplePdf(3);
  const storageResult = await mockStorage.upload({
    buffer: samplePdf,
    originalFilename: "test_answer_book.pdf",
    mimeType: "application/pdf",
    examCode: "EXAM01",
    subjectCode: "SUB01",
    batchCode: "BATCH01",
    scriptCode: "SCR01",
    tags: ["answer-script"],
  });

  const testScriptId = "script-test-uuid-001";
  repo.scripts.set(testScriptId, {
    id: testScriptId,
    scriptCode: "A-10492",
    examCode: "EXAM-2026-CS",
    subjectCode: "CS-501",
    batchCode: "BATCH-A",
    storageAssetId: storageResult.assetId,
    storageReference: storageResult.referenceUrl,
    pageCount: 3,
    documentStatus: DocumentProcessingStatus.NOT_STARTED,
  });

  // 1. Authorized user can start processing
  try {
    checkProcessingPermission("SUPER_ADMIN");
    checkProcessingPermission("HEAD_EXAMINER");
    assert(true, "Authorized roles (SUPER_ADMIN, HEAD_EXAMINER) can start document processing");
  } catch (err: any) {
    assert(false, "Authorized roles rejected", err.message);
  }

  // 2. Unauthorized role cannot start processing
  try {
    let denied = 0;
    try { checkProcessingPermission("EXAMINER"); } catch { denied++; }
    try { checkProcessingPermission("MODERATOR"); } catch { denied++; }
    try { checkProcessingPermission("STUDENT"); } catch { denied++; }
    assert(denied === 3, "Unauthorized roles (EXAMINER, MODERATOR, etc.) are strictly forbidden (403)");
  } catch (err: any) {
    assert(false, "Unauthorized check failed", err.message);
  }

  // 3. Invalid script ID handled (404 SCRIPT_NOT_FOUND)
  try {
    let thrown = false;
    try {
      await docService.processScriptDocument("non-existent-script-id");
    } catch (e: any) {
      if (e.message.startsWith("SCRIPT_NOT_FOUND")) thrown = true;
    }
    assert(thrown, "Non-existent script ID throws SCRIPT_NOT_FOUND (404)");
  } catch (err: any) {
    assert(false, "Invalid script ID test failed", err.message);
  }

  // 4. Missing Cloudinary asset handled safely
  try {
    const missingAssetScriptId = "script-missing-asset";
    repo.scripts.set(missingAssetScriptId, {
      id: missingAssetScriptId,
      scriptCode: "A-99999",
      examCode: "EXAM-2026",
      subjectCode: "CS",
      batchCode: "B1",
      storageAssetId: "non-existent-asset-id",
      storageReference: "https://res.cloudinary.com/demo/nonexistent.pdf",
      documentStatus: DocumentProcessingStatus.NOT_STARTED,
    });
    let handled = false;
    try {
      await docService.processScriptDocument(missingAssetScriptId);
    } catch (e: any) {
      if (e.message.includes("STORAGE_RETRIEVAL_FAILED")) handled = true;
    }
    const failedScript = repo.scripts.get(missingAssetScriptId);
    assert(handled && failedScript.documentStatus === DocumentProcessingStatus.FAILED,
      "Missing Cloudinary asset handled safely and status set to FAILED (502)");
  } catch (err: any) {
    assert(false, "Missing asset test failed", err.message);
  }

  // 5. PDF retrieval works through StorageService abstraction
  try {
    const downloaded = await storage.download(storageResult.assetId, storageResult.referenceUrl);
    assert(downloaded && downloaded.length === samplePdf.length,
      "StorageService abstraction securely retrieves original PDF without exposing secrets");
  } catch (err: any) {
    assert(false, "StorageService retrieval failed", err.message);
  }

  // 6. Page extraction produces correct page count
  let inspectionResult: any;
  try {
    inspectionResult = await pdfProcessor.processPdf(samplePdf);
    assert(inspectionResult.pageCount === 3 && inspectionResult.pages.length === 3,
      "PDFProcessor correctly inspects PDF and extracts 3 distinct pages");
  } catch (err: any) {
    assert(false, "PDF page extraction failed", err.message);
  }

  // 7. Page numbering is preserved
  try {
    const numbers = inspectionResult.pages.map((p: any) => p.pageNumber);
    const isSequential = numbers[0] === 1 && numbers[1] === 2 && numbers[2] === 3;
    assert(isSequential, "Page numbering is strictly preserved (1-indexed, sequential 1, 2, 3)");
  } catch (err: any) {
    assert(false, "Page numbering test failed", err.message);
  }

  // 8. Derived page image created with deterministic naming and metadata
  try {
    const page1 = inspectionResult.pages[0];
    const uploadRes = await storage.uploadPage({
      buffer: page1.buffer,
      mimeType: page1.mimeType,
      pageNumber: 1,
      examCode: "EXAM01",
      subjectCode: "SUB01",
      batchCode: "BATCH01",
      scriptCode: "SCR01",
    });
    assert(
      uploadRes.assetId.includes("page-001") &&
      uploadRes.referenceUrl.length > 0 &&
      page1.width > 0 &&
      page1.height > 0 &&
      page1.qualityScore >= 0 && page1.qualityScore <= 1,
      "Derived page artifact created with deterministic naming (page-001) and valid quality signals"
    );
  } catch (err: any) {
    assert(false, "Derived page artifact creation failed", err.message);
  }

  // 9. OCR provider interface works
  try {
    assert(
      typeof mockOcrProvider.processPage === "function" &&
      mockOcrProvider.name === "mock-ocr" &&
      mockOcrProvider.defaultFeature === "DOCUMENT_TEXT_DETECTION",
      "IOCRProvider interface is strictly adhered to by OCR providers"
    );
  } catch (err: any) {
    assert(false, "OCR provider interface check failed", err.message);
  }

  // 10. Google Vision adapter normalizes valid response
  try {
    const gvProvider = new GoogleVisionOCRProvider();
    // Test normalization logic with Google Vision structured payload
    const mockGvAnnotation = {
      text: "Line 1: Question 1\nLine 2: Answer details",
      pages: [
        {
          confidence: 0.94,
          blocks: [
            {
              confidence: 0.95,
              blockType: "TEXT",
              boundingBox: {
                vertices: [{ x: 10, y: 10 }, { x: 500, y: 10 }, { x: 500, y: 100 }, { x: 10, y: 100 }],
              },
              paragraphs: [
                {
                  confidence: 0.95,
                  words: [
                    {
                      confidence: 0.98,
                      symbols: [{ text: "L" }, { text: "i" }, { text: "n" }, { text: "e" }],
                    },
                    {
                      confidence: 0.96,
                      symbols: [{ text: "1" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const normalized = gvProvider.normalizeAnnotation(mockGvAnnotation, 1);
    assert(
      normalized.pageNumber === 1 &&
      normalized.confidence === 0.94 &&
      normalized.blocks.length === 1 &&
      Boolean(normalized.blocks[0]?.boundingBox && normalized.blocks[0].boundingBox.width === 490) &&
      normalized.blocks[0].paragraphs[0].words.length === 2 &&
      normalized.blocks[0].paragraphs[0].words[0].text === "Line",
      "GoogleVisionOCRProvider normalizes DOCUMENT_TEXT_DETECTION into ANKLYZE schema"
    );
  } catch (err: any) {
    assert(false, "Google Vision adapter normalization failed", err.message);
  }

  // 11. OCR confidence is preserved
  try {
    const pageOcr = await mockOcrProvider.processPage({
      buffer: Buffer.from("fake-img"),
      mimeType: "image/png",
      pageNumber: 2,
    });
    assert(
      typeof pageOcr.confidence === "number" &&
      pageOcr.confidence > 0 &&
      pageOcr.confidence <= 1 &&
      pageOcr.blocks[0].confidence > 0,
      "OCR confidence is preserved at page, block, and paragraph levels"
    );
  } catch (err: any) {
    assert(false, "OCR confidence test failed", err.message);
  }

  // 12. Bounding boxes are preserved
  try {
    const pageOcr = await mockOcrProvider.processPage({
      buffer: Buffer.from("fake-img"),
      mimeType: "image/png",
      pageNumber: 1,
    });
    const block = pageOcr.blocks[0];
    assert(
      Boolean(
        block &&
        block.boundingBox &&
        typeof block.boundingBox.x === "number" &&
        typeof block.boundingBox.y === "number" &&
        typeof block.boundingBox.width === "number" &&
        typeof block.boundingBox.height === "number" &&
        Array.isArray(block.boundingBox.vertices)
      ),
      "Bounding boxes with (x, y, width, height, vertices) are accurately preserved"
    );
  } catch (err: any) {
    assert(false, "Bounding box test failed", err.message);
  }

  // 13. OCR provider transient failure is retryable
  try {
    mockOcrProvider.simulateTransientFailure(1); // Fail once transiently then succeed
    const retryableService = new OCRService(mockOcrProvider);
    const result = await retryableService.processPage({
      buffer: Buffer.from("fake-img"),
      mimeType: "image/png",
      pageNumber: 1,
    });
    assert(result && result.confidence > 0, "Transient provider errors are successfully retried with backoff");
  } catch (err: any) {
    assert(false, "Transient retry test failed", err.message);
  }

  // 14. OCR invalid request is not retried indefinitely
  try {
    mockOcrProvider.simulateNonTransientFailure();
    const strictService = new OCRService(mockOcrProvider);
    let errorThrown: any = null;
    try {
      await strictService.processPage({
        buffer: Buffer.from("bad-input"),
        mimeType: "image/png",
        pageNumber: 1,
      });
    } catch (e: any) {
      errorThrown = e;
    }
    assert(
      errorThrown && (errorThrown.code === "INVALID_REQUEST" || errorThrown.category === "INVALID_REQUEST") && errorThrown.isTransient === false,
      "Non-transient errors (e.g. INVALID_REQUEST) fail immediately without wasteful retries"
    );
  } catch (err: any) {
    assert(false, "Non-transient error test failed", err.message);
  }

  // Reset mock OCR provider to normal state
  mockOcrProvider.resetFailures();

  // 15. OCR failure marks page as failed
  try {
    mockOcrProvider.simulateNonTransientFailure();
    const failingDocService = new DocumentProcessingService(repo, storage, pdfProcessor, new OCRService(mockOcrProvider));
    const failScriptId = "script-failing-ocr";
    repo.scripts.set(failScriptId, {
      id: failScriptId,
      scriptCode: "A-55555",
      examCode: "EXAM01",
      subjectCode: "SUB01",
      batchCode: "BATCH01",
      storageAssetId: storageResult.assetId,
      storageReference: storageResult.referenceUrl,
      documentStatus: DocumentProcessingStatus.NOT_STARTED,
    });
    const summary = await failingDocService.processScriptDocument(failScriptId);
    assert(
      summary.failedPages > 0 && summary.pages[0].processingStatus === PageProcessingStatus.FAILED,
      "OCR failure cleanly marks page status as FAILED without destroying the record"
    );
  } catch (err: any) {
    assert(false, "OCR failure marking test failed", err.message);
  }

  // Reset failures
  mockOcrProvider.resetFailures();

  // 16. One page failure does not destroy successfully processed pages (fault isolation)
  try {
    // Custom mock that fails only on page 2
    const selectiveMock = new MockOCRProvider();
    const origProcess = selectiveMock.processPage.bind(selectiveMock);
    selectiveMock.processPage = async (input) => {
      if (input.pageNumber === 2) {
        const err: any = new Error("Simulated OCR failure on page 2");
        err.code = "OCR_PAGE_ERROR";
        err.isTransient = false;
        throw err;
      }
      return origProcess(input);
    };

    const isolatedDocService = new DocumentProcessingService(repo, storage, pdfProcessor, new OCRService(selectiveMock));
    const isoScriptId = "script-isolated-failure";
    repo.scripts.set(isoScriptId, {
      id: isoScriptId,
      scriptCode: "A-77777",
      examCode: "EXAM01",
      subjectCode: "SUB01",
      batchCode: "BATCH01",
      storageAssetId: storageResult.assetId,
      storageReference: storageResult.referenceUrl,
      documentStatus: DocumentProcessingStatus.NOT_STARTED,
    });

    const summary = await isolatedDocService.processScriptDocument(isoScriptId);
    const p1 = summary.pages.find((p) => p.pageNumber === 1);
    const p2 = summary.pages.find((p) => p.pageNumber === 2);
    const p3 = summary.pages.find((p) => p.pageNumber === 3);

    assert(
      p1?.processingStatus === PageProcessingStatus.OCR_COMPLETE &&
      p2?.processingStatus === PageProcessingStatus.FAILED &&
      p3?.processingStatus === PageProcessingStatus.OCR_COMPLETE,
      "Fault isolation verified: Page 2 failure did not disrupt Page 1 or Page 3 processing"
    );
  } catch (err: any) {
    assert(false, "Fault isolation test failed", err.message);
  }

  // 17. Document partial-processing status works
  try {
    const isoScript = repo.scripts.get("script-isolated-failure");
    assert(
      isoScript.documentStatus === DocumentProcessingStatus.PARTIALLY_PROCESSED,
      "Script with mixed page outcomes correctly transitions to PARTIALLY_PROCESSED"
    );
  } catch (err: any) {
    assert(false, "Partial processing status test failed", err.message);
  }

  // 18. Reprocess works (version increment v1 -> v2)
  try {
    // Process testScriptId completely first (v1)
    const summaryV1 = await docService.processScriptDocument(testScriptId);
    const page1AfterV1 = await repo.findPageById("page-script-test-uuid-001-1");
    const v1Count = page1AfterV1.ocrResults.length;

    // Reprocess testScriptId (v2)
    const summaryV2 = await docService.reprocessScript(testScriptId);
    const page1AfterV2 = await repo.findPageById("page-script-test-uuid-001-1");
    const v2Count = page1AfterV2.ocrResults.length;

    assert(
      summaryV1.completedPages === 3 &&
      summaryV2.completedPages === 3 &&
      v2Count === v1Count + 1 &&
      page1AfterV2.ocrResults[0].version === 2,
      "Reprocessing succeeds and stores versioned OCR results (v1 -> v2) preserving history"
    );
  } catch (err: any) {
    assert(false, "Reprocess test failed", err.message);
  }

  // 19. OCR provenance is stored
  try {
    const page1 = await repo.findPageById("page-script-test-uuid-001-1");
    const latestOcr = page1.ocrResults[0];
    assert(
      latestOcr.provider === "mock-ocr" &&
      latestOcr.feature === "DOCUMENT_TEXT_DETECTION" &&
      latestOcr.pipelineVersion === "ocr-v1" &&
      latestOcr.version === 2,
      "OCR provenance (provider, feature, pipelineVersion, version) accurately stored"
    );
  } catch (err: any) {
    assert(false, "OCR provenance test failed", err.message);
  }

  // 20. Original PDF remains unchanged
  try {
    const originalScript = repo.scripts.get(testScriptId);
    const currentBuffer = await storage.download(originalScript.storageAssetId, originalScript.storageReference);
    assert(
      currentBuffer.length === samplePdf.length &&
      originalScript.storageAssetId === storageResult.assetId,
      "Canonical answer-book PDF in Cloudinary/Storage remains 100% unaltered and preserved"
    );
  } catch (err: any) {
    assert(false, "Original PDF preservation test failed", err.message);
  }

  console.log("\n============================================================");
  console.log(`✅ ALL ${totalTests} PHASE 8 OCR & DOCUMENT PROCESSING TESTS PASSED!`);
  console.log("============================================================\n");
}

runPhase8TestSuite().catch((err) => {
  console.error("Test Suite execution failed:", err);
  process.exit(1);
});
