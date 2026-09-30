import { config } from "../config/env";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ANKLYZE API - Backend Foundation",
    version: "1.0.0",
    description:
      "ANKLYZE Backend API Foundation — 'Analyse the marks, not just the paper.' Foundation services for examination evaluation platform.",
    contact: {
      name: "ANKLYZE Engineering Team",
      email: "support@anklyze.mponline.gov.in",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}${config.API_PREFIX}`,
      description: "Local development server",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Service Liveness Check",
        description: "Returns the operational status, service name, and timestamp of ANKLYZE API.",
        tags: ["System Health"],
        responses: {
          "200": {
            description: "Service is online and healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                        service: { type: "string", example: "ANKLYZE API" },
                        environment: { type: "string", example: "development" },
                        timestamp: { type: "string", format: "date-time" },
                        uptimeSeconds: { type: "integer", example: 124 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        summary: "Database Readiness Check",
        description: "Validates connectivity to PostgreSQL database via Prisma ORM.",
        tags: ["System Health"],
        responses: {
          "200": {
            description: "Database is reachable and ready to process transactions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ready" },
                        database: { type: "string", example: "connected" },
                        service: { type: "string", example: "ANKLYZE API" },
                        timestamp: { type: "string", format: "date-time" },
                        latencyMs: { type: "integer", example: 12 },
                      },
                    },
                  },
                },
              },
            },
          },
          "503": {
            description: "Database service unreachable or disconnected",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    error: {
                      type: "object",
                      properties: {
                        code: { type: "string", example: "DATABASE_UNAVAILABLE" },
                        message: { type: "string", example: "Database service is unreachable or initializing" },
                        details: {
                          type: "object",
                          properties: {
                            database: { type: "string", example: "disconnected" },
                            status: { type: "string", example: "not_ready" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "User Authentication / Login",
        description: "Authenticates a user via email and Argon2id password, issuing a JWT access token and setting a secure HTTP-Only refresh cookie.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "examiner@anklyze.demo" },
                  password: { type: "string", format: "password", example: "AnklyzeExaminer#2026" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            email: { type: "string" },
                            fullName: { type: "string" },
                            role: { type: "string", example: "EXAMINER" },
                            status: { type: "string", example: "ACTIVE" },
                          },
                        },
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials or inactive account",
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh Access Token Session",
        description: "Rotates refresh token and issues a new short-lived JWT access token.",
        tags: ["Authentication"],
        responses: {
          "200": {
            description: "Session refreshed successfully with rotated tokens",
          },
          "401": {
            description: "Invalid, expired, or revoked refresh token",
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout and Revoke Session",
        description: "Revokes the active refresh session in the database and clears the HTTP-Only cookie.",
        tags: ["Authentication"],
        responses: {
          "200": {
            description: "Logged out successfully",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get Current Authenticated User Profile",
        description: "Retrieves identity, role, and department information for the active user token.",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile retrieved successfully",
          },
          "401": {
            description: "Authentication required or token expired",
          },
        },
      },
    },
    "/exams": {
      get: {
        summary: "List Examinations",
        description: "Returns all examinations. Available to SUPER_ADMIN, HEAD_EXAMINER, and EXAMINER.",
        tags: ["Examinations"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of examinations returned" },
        },
      },
      post: {
        summary: "Create Examination",
        description: "Creates an examination cycle. Requires SUPER_ADMIN or HEAD_EXAMINER role.",
        tags: ["Examinations"],
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Exam created" },
          "403": { description: "Insufficient role permissions" },
          "409": { description: "Duplicate exam code" },
        },
      },
    },
    "/exams/{examId}": {
      get: {
        summary: "Get Examination Details",
        description: "Retrieves full examination configuration including subjects and examiner assignments.",
        tags: ["Examinations"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Exam retrieved" },
          "404": { description: "Exam not found" },
        },
      },
      patch: {
        summary: "Update Examination",
        description: "Updates examination metadata. Requires SUPER_ADMIN or HEAD_EXAMINER.",
        tags: ["Examinations"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Exam updated" },
          "403": { description: "Forbidden" },
        },
      },
      delete: {
        summary: "Archive Examination",
        description: "Soft deletes / archives an examination. Requires SUPER_ADMIN or HEAD_EXAMINER.",
        tags: ["Examinations"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Exam archived" },
        },
      },
    },
    "/exams/{examId}/subjects": {
      get: {
        summary: "List Subjects for Exam",
        tags: ["Subjects"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Subjects list" } },
      },
      post: {
        summary: "Create Subject",
        tags: ["Subjects"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Subject created" }, "409": { description: "Duplicate subject code" } },
      },
    },
    "/subjects/{subjectId}/questions": {
      get: {
        summary: "List Questions for Subject",
        tags: ["Questions"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Questions list" } },
      },
      post: {
        summary: "Create Question",
        tags: ["Questions"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Question created" }, "400": { description: "Invalid marks" } },
      },
    },
    "/subjects/{subjectId}/marking-schemes": {
      get: {
        summary: "List Marking Schemes for Subject",
        tags: ["Marking Schemes"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Marking schemes list" } },
      },
      post: {
        summary: "Create Marking Scheme",
        tags: ["Marking Schemes"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Marking scheme created" } },
      },
    },
    "/subjects/{subjectId}/examiners": {
      get: {
        summary: "List Assigned Examiners",
        tags: ["Examiner Assignments"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Assignments list" } },
      },
      post: {
        summary: "Assign Examiner to Subject",
        description: "Assigns a verified EXAMINER user to a subject. Requires SUPER_ADMIN or HEAD_EXAMINER.",
        tags: ["Examiner Assignments"],
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Examiner assigned" },
          "400": { description: "Target user does not have EXAMINER role" },
        },
      },
    },
    "/marking-schemes/{id}/analyze": {
      post: {
        summary: "Analyze Marking Scheme with AI",
        description: "Transforms a human marking scheme into a structured, machine-readable rubric with ambiguity detection. Uses Gemini as primary provider with Groq fallback. Requires SUPER_ADMIN or HEAD_EXAMINER.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Marking Scheme ID",
          },
        ],
        responses: {
          "201": { description: "Rubric analysis completed and persisted" },
          "400": { description: "Invalid marking scheme or questions missing" },
          "404": { description: "Marking scheme not found" },
          "409": { description: "Analysis already in progress for this marking scheme" },
          "502": { description: "AI providers failed (transient or fatal)" },
        },
      },
    },
    "/marking-schemes/{id}/analyses": {
      get: {
        summary: "List Rubric Analysis History",
        description: "Retrieves all versioned AI rubric analyses for a given marking scheme. Accessible to SUPER_ADMIN, HEAD_EXAMINER, and EXAMINER.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Marking Scheme ID",
          },
        ],
        responses: {
          "200": { description: "List of versioned analyses with provenance metadata" },
          "404": { description: "Marking scheme not found" },
        },
      },
    },
    "/marking-scheme-analyses/{analysisId}": {
      get: {
        summary: "Get Rubric Analysis Details",
        description: "Fetches full rubric analysis details including questions, criteria, and ambiguities. Logs review audit trail.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "analysisId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Analysis ID",
          },
        ],
        responses: {
          "200": { description: "Analysis record with questions and issues" },
          "404": { description: "Analysis not found" },
        },
      },
      patch: {
        summary: "Modify Rubric Criterion (Human Modification)",
        description: "Allows a human reviewer to modify an AI-generated criterion while preserving the original AI value for provenance.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "analysisId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Analysis ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["criterionId"],
                properties: {
                  criterionId: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  maxMarks: { type: "number" },
                  partialCreditAllowed: { type: "boolean" },
                  alternateMethodAccepted: { type: "boolean" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Criterion updated with human modification provenance" },
          "400": { description: "Invalid criterion input" },
          "404": { description: "Criterion not found" },
        },
      },
    },
    "/marking-scheme-analyses/{analysisId}/approve": {
      post: {
        summary: "Approve Rubric Analysis",
        description: "Approves an AI rubric after human review. Enforces mark total validation and role permissions (SUPER_ADMIN, HEAD_EXAMINER).",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "analysisId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Analysis ID",
          },
        ],
        responses: {
          "200": { description: "Rubric successfully approved and published" },
          "400": { description: "Validation failure (criteria marks do not sum to question total)" },
          "404": { description: "Analysis not found" },
          "409": { description: "Analysis already approved" },
        },
      },
    },
    "/marking-scheme-analyses/{analysisId}/reject": {
      post: {
        summary: "Reject Rubric Analysis",
        description: "Rejects an AI rubric analysis with an explicit reason.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "analysisId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Analysis ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string", minLength: 3 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Analysis marked as REJECTED" },
          "400": { description: "Missing rejection reason" },
          "404": { description: "Analysis not found" },
        },
      },
    },
    "/marking-scheme-analyses/{analysisId}/reanalyze": {
      post: {
        summary: "Request Rubric Re-analysis",
        description: "Triggers a re-analysis that creates a new version while preserving the previous analysis history.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "analysisId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Analysis ID",
          },
        ],
        responses: {
          "201": { description: "New analysis version created" },
          "404": { description: "Analysis not found" },
        },
      },
    },
    "/marking-scheme-analyses/issues/{issueId}/resolve": {
      post: {
        summary: "Resolve Flagged Rubric Ambiguity",
        description: "Marks a detected ambiguity or incomplete rule as resolved by the human reviewer.",
        tags: ["AI Rubric Engine"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "issueId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Issue ID",
          },
        ],
        responses: {
          "200": { description: "Issue marked as resolved" },
          "404": { description: "Issue not found" },
        },
      },
    },
    "/script-batches": {
      post: {
        summary: "Create Script Intake Batch",
        description: "Creates an intake batch linked to an Examination and Subject for scanned answer books.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["examId", "subjectId"],
                properties: {
                  examId: { type: "string", format: "uuid" },
                  subjectId: { type: "string", format: "uuid" },
                  batchCode: { type: "string", example: "BATCH-2026-CS301-001" },
                  source: { type: "string", default: "DIGITAL_SCANNER" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Script batch created successfully" },
          "400": { description: "Invalid input or Exam/Subject mismatch" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER role" },
          "409": { description: "Batch code already exists" },
        },
      },
      get: {
        summary: "List Script Intake Batches",
        description: "Retrieves list of intake batches with filtering by exam, subject, and status.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "examId", in: "query", schema: { type: "string" } },
          { name: "subjectId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of script batches" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/script-batches/{batchId}": {
      get: {
        summary: "Get Batch Details",
        description: "Retrieves intake batch details with per-batch metrics and script count.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Batch details" },
          "404": { description: "Batch not found" },
        },
      },
    },
    "/script-batches/{batchId}/scripts": {
      post: {
        summary: "Upload Scanned Answer Scripts (Single or Bulk)",
        description: "Uploads one or multiple scanned PDF answer books into the intake batch. Validates MIME type, magic bytes, SHA-256 duplicate detection, assigns anonymized script ID, stores via Cloudinary abstraction.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Scanned answer book PDF files (max 25MB each)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Batch upload processed. Returns per-file status (SUCCESS, DUPLICATE, REJECTED, FAILED) and overall batch summary." },
          "400": { description: "No files provided or oversized file" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER role" },
          "404": { description: "Batch not found" },
        },
      },
    },
    "/scripts": {
      get: {
        summary: "List Ingested Answer Scripts",
        description: "Returns paginated list of ingested answer scripts with anonymized IDs, metadata, and intake status.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "examId", in: "query", schema: { type: "string" } },
          { name: "subjectId", in: "query", schema: { type: "string" } },
          { name: "batchId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 25 } },
        ],
        responses: {
          "200": { description: "Paginated list of answer scripts" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/scripts/{scriptId}": {
      get: {
        summary: "Get Ingested Script Details",
        description: "Retrieves details of an ingested answer script, including anonymized script code, original filename, page count, checksum, and storage reference.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Answer script details" },
          "404": { description: "Script not found" },
        },
      },
    },
    "/exams/{examId}/scripts": {
      get: {
        summary: "List Scripts for Examination",
        description: "Retrieves all ingested answer scripts belonging to a specific examination.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "examId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of scripts" },
          "404": { description: "Exam not found" },
        },
      },
    },
    "/subjects/{subjectId}/scripts": {
      get: {
        summary: "List Scripts for Subject",
        description: "Retrieves all ingested answer scripts belonging to a specific subject.",
        tags: ["Answer Script Intake"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "subjectId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of scripts" },
          "404": { description: "Subject not found" },
        },
      },
    },
    "/scripts/{scriptId}/process": {
      post: {
        summary: "Process Answer Script Document",
        description: "Initiates PDF inspection, page extraction, image preprocessing, and OCR text/layout extraction via Google Cloud Vision API.",
        tags: ["Document Processing & OCR"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  languageHints: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional language hints (e.g. ['en', 'hi'])",
                  },
                  forceReprocess: {
                    type: "boolean",
                    description: "Set true to force re-execution even if already completed",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Processing completed with page summary and confidence metrics" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER" },
          "404": { description: "Answer script not found" },
          "422": { description: "PDF processing or page extraction failed" },
          "502": { description: "Storage retrieval failed" },
        },
      },
    },
    "/scripts/{scriptId}/reprocess": {
      post: {
        summary: "Reprocess Answer Script Document",
        description: "Forces fresh OCR extraction and creates versioned OCR artifacts (e.g. v2) while strictly preserving historical OCR runs and original PDF.",
        tags: ["Document Processing & OCR"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Reprocessing completed with new OCR version" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER" },
          "404": { description: "Answer script not found" },
        },
      },
    },
    "/scripts/{scriptId}/processing": {
      get: {
        summary: "Get Document Processing Status",
        description: "Retrieves document processing status, total pages, completed count, needs-review count, and average OCR confidence.",
        tags: ["Document Processing & OCR"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Processing status and page overview" },
          "401": { description: "Unauthorized" },
          "404": { description: "Answer script not found" },
        },
      },
    },
    "/scripts/{scriptId}/pages": {
      get: {
        summary: "List Derived Script Pages",
        description: "Retrieves all extracted pages for the answer script with latest OCR results and bounding boxes.",
        tags: ["Document Processing & OCR"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of derived pages with OCR output" },
          "401": { description: "Unauthorized" },
          "404": { description: "Answer script not found" },
        },
      },
    },
    "/scripts/{scriptId}/pages/{pageId}": {
      get: {
        summary: "Get Page Detail and OCR History",
        description: "Retrieves a single script page with dimensions, quality score, and complete historical OCR result versions.",
        tags: ["Document Processing & OCR"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
          { name: "pageId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Page details and all OCR versions" },
          "401": { description: "Unauthorized" },
          "404": { description: "Page not found" },
        },
      },
    },
    "/scripts/{scriptId}/reconstruct": {
      post: {
        summary: "Trigger Answer Reconstruction",
        description: "Executes hybrid two-stage answer reconstruction (deterministic candidate detection with multimodal AI ambiguity resolution) to map questions to pages.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  forceRerun: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reconstruction completed successfully" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER" },
          "404": { description: "Answer script not found" },
          "412": { description: "Precondition failed - OCR or question structure missing" },
        },
      },
    },
    "/scripts/{scriptId}/reconstruct/retry": {
      post: {
        summary: "Retry Answer Reconstruction",
        description: "Forces a re-run of answer reconstruction creating a new version (v2, v3) while preserving historical versions.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "New reconstruction version created" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER" },
          "404": { description: "Answer script not found" },
        },
      },
    },
    "/scripts/{scriptId}/reconstruction": {
      get: {
        summary: "Get Structured Answer Map",
        description: "Retrieves the versioned structured answer map, question-to-page mappings, confidence scores, and review cases.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
          { name: "version", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Structured answer map with full provenance" },
          "401": { description: "Unauthorized" },
          "404": { description: "Reconstruction not found" },
        },
      },
    },
    "/scripts/{scriptId}/attempts": {
      get: {
        summary: "List Question Attempts",
        description: "Retrieves all reconstructed question attempts for the specified script.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of question attempts" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/scripts/{scriptId}/attempts/{attemptId}": {
      get: {
        summary: "Get Question Attempt Detail",
        description: "Retrieves details of a question attempt including associated pages, regions, state, and confidence.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
          { name: "attemptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Question attempt details" },
          "404": { description: "Attempt not found" },
        },
      },
    },
    "/question-attempts/{attemptId}/resolve": {
      post: {
        summary: "Resolve Reconstruction Ambiguity",
        description: "Manually resolves a question attempt review case, recording user ID, reason, and original system decision.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "attemptId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  state: {
                    type: "string",
                    enum: [
                      "ACTIVE",
                      "CANCELLED",
                      "BLANK",
                      "CONTINUATION",
                      "DUPLICATE_ATTEMPT",
                      "UNREADABLE",
                      "REQUIRES_REVIEW",
                    ],
                  },
                  questionId: { type: "string", format: "uuid" },
                  reason: { type: "string", example: "Confirmed Q4 continuation on page 5" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Attempt resolved successfully" },
          "400": { description: "Validation error" },
          "403": { description: "Forbidden - Requires SUPER_ADMIN or HEAD_EXAMINER" },
          "404": { description: "Attempt not found" },
        },
      },
    },
    "/scripts/{scriptId}/supplementary/link": {
      post: {
        summary: "Link Supplementary Script",
        description: "Links a supplementary answer booklet to a main answer script.",
        tags: ["Answer Reconstruction & Question Mapping"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scriptId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["supplementaryScriptId"],
                properties: {
                  supplementaryScriptId: { type: "string", format: "uuid" },
                  barcodeValue: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Supplementary script linked successfully" },
          "403": { description: "Forbidden" },
        },
      },
    },
    // Phase 10: AI-Assisted Evaluation Endpoints
    "/question-attempts/{id}/evaluate": {
      post: {
        summary: "Evaluate Question Attempt (AI)",
        description: "Triggers rubric-grounded AI evaluation for a specific student question attempt with evidence mapping.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  forceRefresh: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Attempt evaluated successfully" },
          "400": { description: "Validation error" },
          "403": { description: "Forbidden - Requires EXAMINER, HEAD_EXAMINER, or SUPER_ADMIN" },
          "500": { description: "Evaluation error" },
        },
      },
    },
    "/question-attempts/{id}/evaluation": {
      get: {
        summary: "Get Question Attempt Evaluation",
        description: "Retrieves the latest evaluation, suggested marks, confidence, criteria breakdown, and linked evidence.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Evaluation retrieved successfully" },
          "404": { description: "Evaluation not found" },
        },
      },
    },
    "/question-attempts/{id}/evaluate/retry": {
      post: {
        summary: "Retry AI Evaluation",
        description: "Forces a fresh AI evaluation re-run for a question attempt.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Evaluation retry completed successfully" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/evaluations/{id}/decision": {
      patch: {
        summary: "Save Examiner Decision",
        description: "Records the human examiner's final grading decision (ACCEPT, OVERRIDE, FLAGGED), preserving AI suggestions.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decisionType", "totalMarksAwarded"],
                properties: {
                  decisionType: { type: "string", enum: ["ACCEPTED", "OVERRIDDEN", "FLAGGED"] },
                  totalMarksAwarded: { type: "number", minimum: 0 },
                  examinerNotes: { type: "string" },
                  criteriaOverrides: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["criterionId", "marksAwarded"],
                      properties: {
                        criterionId: { type: "string" },
                        marksAwarded: { type: "number" },
                        examinerComment: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Examiner decision saved successfully" },
          "400": { description: "Validation error" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/evaluations/{id}/criteria/{criterionId}": {
      patch: {
        summary: "Update Criterion Score",
        description: "Updates score and comments for an individual rubric criterion within an evaluation.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "criterionId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["marksAwarded"],
                properties: {
                  marksAwarded: { type: "number", minimum: 0 },
                  examinerComment: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Criterion score updated successfully" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/evaluations/{id}/flag-review": {
      post: {
        summary: "Flag Evaluation for Review",
        description: "Flags an evaluation requiring senior examiner / moderator review.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Evaluation flagged for review" },
        },
      },
    },
    "/evaluations/{id}/evidence": {
      get: {
        summary: "Get Evaluation Evidence",
        description: "Retrieves structured visual and textual evidence mapped to rubric criteria.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Evidence retrieved successfully" },
        },
      },
    },
    "/evaluations/{id}/provenance": {
      get: {
        summary: "Get Evaluation Provenance",
        description: "Retrieves AI model provenance, prompt version, fallback metadata, and audit timestamps.",
        tags: ["AI-Assisted Evaluation (Phase 10)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Provenance metadata retrieved successfully" },
        },
      },
    },
    "/evaluations/{id}/decisions": {
      get: {
        summary: "Get Human Decision History",
        description: "Returns the complete immutable list of human examiner decision versions.",
        tags: ["Human Evaluation & Provenance (Phase 11)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Decision history retrieved successfully" },
        },
      },
      post: {
        summary: "Create New Decision Version",
        description: "Creates an immutable draft, override, accept, or flag decision version with optimistic locking.",
        tags: ["Human Evaluation & Provenance (Phase 11)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decisionType", "totalMarks"],
                properties: {
                  decisionType: { type: "string", enum: ["ACCEPT_AI_SUGGESTION", "OVERRIDE_AI", "SAVE_DRAFT", "FLAG_FOR_REVIEW", "FINALIZE", "REOPEN"] },
                  status: { type: "string", enum: ["DRAFT", "FINAL"] },
                  totalMarks: { type: "number" },
                  expectedVersion: { type: "integer" },
                  notes: { type: "string" },
                  overrideReason: { type: "string" },
                  reopenReason: { type: "string" },
                  criteriaDecisions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["criterionId", "marksAwarded"],
                      properties: {
                        criterionId: { type: "string" },
                        criterionName: { type: "string" },
                        marksAwarded: { type: "number" },
                        examinerComment: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Decision version created successfully" },
          "400": { description: "Validation error or missing override reason" },
          "409": { description: "Stale version conflict" },
        },
      },
    },
    "/evaluations/{id}/current-decision": {
      get: {
        summary: "Get Current Effective Decision",
        description: "Resolves the authoritative effective decision (FINAL > DRAFT > AI advisory).",
        tags: ["Human Evaluation & Provenance (Phase 11)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Current effective decision retrieved successfully" },
        },
      },
    },
    "/evaluations/{id}/finalize": {
      post: {
        summary: "Finalize Examiner Decision",
        description: "Transitions the current draft decision to authoritative status FINAL.",
        tags: ["Human Evaluation & Provenance (Phase 11)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notes: { type: "string" },
                  expectedVersion: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Decision finalized successfully" },
          "400": { description: "Already finalized or validation error" },
        },
      },
    },
    "/evaluations/{id}/reopen": {
      post: {
        summary: "Reopen Finalized Decision",
        description: "Reopens a finalized decision for revision under a new draft version.",
        tags: ["Human Evaluation & Provenance (Phase 11)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reopenReason"],
                properties: {
                  reopenReason: { type: "string", minLength: 3 },
                  expectedVersion: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Decision reopened under new draft version" },
          "400": { description: "Not currently finalized or missing reopen reason" },
        },
      },
    },
    "/evaluations/{id}/history": {
      get: {
        summary: "Get Full Timeline History",
        description: "Retrieves complete chronological timeline of AI and Human evaluation events.",
        tags: ["Human Evaluation & Provenance (Phase 11)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Timeline history retrieved successfully" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};
