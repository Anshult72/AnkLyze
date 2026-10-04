import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { PDFProcessorService } from "../services/pdfProcessor.service";

async function run() {
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 300]).drawText("Question 1 answer", { x: 20, y: 200 });
  pdf.addPage([300, 200]).drawText("Question 2 answer", { x: 20, y: 100 });
  const original = Buffer.from(await pdf.save());

  const result = await new PDFProcessorService().processPdf(original);
  assert.equal(result.pageCount, 2);
  assert.deepEqual(result.pages.map((page) => page.pageNumber), [1, 2]);
  for (const page of result.pages) {
    assert.equal(page.mimeType, "image/png");
    assert.equal(page.buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.ok(page.width >= 500 && page.height >= 500);
    assert.ok(page.fileSize > 1024);
  }
  assert.notDeepEqual(result.pages[0].buffer, result.pages[1].buffer);
  assert.equal(original.subarray(0, 4).toString("utf8"), "%PDF");
  console.log("PDF page rasterization checks passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
