CREATE TABLE "question_papers" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "storageProvider" "StorageProviderType" NOT NULL,
  "storageAssetId" TEXT NOT NULL,
  "storageReference" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "pageCount" INTEGER NOT NULL,
  "processingStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "extractionError" TEXT,
  "uploadedById" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "question_papers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_paper_items" (
  "id" TEXT NOT NULL,
  "paperId" TEXT NOT NULL,
  "questionId" TEXT,
  "questionNumber" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "maximumMarks" DOUBLE PRECISION,
  "section" TEXT,
  "pageNumber" INTEGER NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "reviewStatus" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "question_paper_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "question_papers_subjectId_sha256_key" ON "question_papers"("subjectId", "sha256");
CREATE INDEX "question_papers_examId_idx" ON "question_papers"("examId");
CREATE INDEX "question_papers_subjectId_processingStatus_idx" ON "question_papers"("subjectId", "processingStatus");
CREATE UNIQUE INDEX "question_paper_items_paperId_questionNumber_key" ON "question_paper_items"("paperId", "questionNumber");
CREATE INDEX "question_paper_items_paperId_orderIndex_idx" ON "question_paper_items"("paperId", "orderIndex");

ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_paper_items" ADD CONSTRAINT "question_paper_items_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "question_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_paper_items" ADD CONSTRAINT "question_paper_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
