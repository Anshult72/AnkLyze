import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractPaperPages, parsePaperQuestions } from "../services/questionPaperExtraction.service";
import { QuestionPaperService } from "../services/questionPaper.service";

async function run() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([600, 800]);
  page.drawText("Section A", { x: 40, y: 700, font });
  page.drawText("1. Explain the water cycle. [5]", { x: 40, y: 670, font });
  page.drawText("Mention evaporation and condensation.", { x: 40, y: 650, font });
  page.drawText("2. Describe the monsoon in India. (3 marks)", { x: 40, y: 610, font });
  const pages = await extractPaperPages(Buffer.from(await pdf.save()));
  assert.equal(pages.length, 1);
  assert.match(pages[0].text, /water cycle/);
  const questions = parsePaperQuestions(pages);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].maximumMarks, 5);
  assert.match(questions[0].questionText, /condensation/);
  assert.equal(questions[1].maximumMarks, 3);
  assert.equal(questions[0].section, "Section A");
  const uncertain = parsePaperQuestions([{ pageNumber: 1, text: "प्रश्न ३. जल चक्र समझाइए", confidence: 0.7 }]);
  assert.equal(uncertain[0].maximumMarks, null);
  await assert.rejects(new QuestionPaperService().upload("unused", {
    originalname: "paper.pdf", mimetype: "application/pdf", buffer: Buffer.from("not a pdf"),
  } as Express.Multer.File, "unused"), /Invalid PDF file/);
  console.log("Question paper extraction checks passed");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
