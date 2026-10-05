import dotenv from "dotenv";
import { z } from "zod";

// Load .env file if available
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("8080")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: "PORT must be a valid port number between 1 and 65535",
    }),
  API_PREFIX: z
    .string()
    .default("/api/v1")
    .transform((val) => (val.startsWith("/") ? val : `/${val}`)),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000"),
  PUBLIC_FRONTEND_ORIGIN: z
    .string()
    .default("https://anklyze-flame.vercel.app"),
  DATABASE_URL: z
    .string()
    .optional()
    .default(""),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long")
    .default("anklyze_jwt_access_dev_secret_key_minimum_32_chars_2026"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters long")
    .default("anklyze_jwt_refresh_dev_secret_key_minimum_32_chars_2026"),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m"),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("7d"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => (val ? val === "true" : process.env.NODE_ENV === "production")),
  COOKIE_SAME_SITE: z
    .enum(["lax", "strict", "none"])
    .default("lax"),
  // Phase 6: AI Rubric Engine Configuration
  AI_PRIMARY_PROVIDER: z
    .enum(["gemini", "groq", "openrouter", "mock"])
    .default("gemini"),
  AI_FALLBACK_PROVIDER: z
    .enum(["gemini", "groq", "openrouter", "mock", "none"])
    .default("groq"),
  AI_PROVIDER_CHAIN: z
    .string()
    .default("gemini,groq,openrouter"),
  GEMINI_API_KEY: z
    .string()
    .optional()
    .default(""),
  GEMINI_MODEL: z
    .string()
    .default("gemini-1.5-flash"),
  GROQ_API_KEY: z
    .string()
    .optional()
    .default(""),
  GROQ_MODEL: z
    .string()
    .default("qwen/qwen3.8-27b"),
  OPENROUTER_API_KEY: z
    .string()
    .optional()
    .default(""),
  OPENROUTER_MODEL: z
    .string()
    .default("qwen/qwen3.8-27b"),
  OPENROUTER_VISION_MODEL: z
    .string()
    .default("qwen/qwen3.8-27b"),
  AI_REQUEST_TIMEOUT_MS: z
    .string()
    .default("20000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1000, {
      message: "AI_REQUEST_TIMEOUT_MS must be at least 1000ms",
    }),
  RUBRIC_PROMPT_VERSION: z
    .string()
    .default("rubric-analysis-v1"),
  // Phase 9 & 10: Multimodal AI Configuration
  GEMINI_VISION_MODEL: z
    .string()
    .default("gemini-1.5-flash"),
  GROQ_VISION_MODEL: z
    .string()
    .default("qwen/qwen3.8-27b"),
  RECONSTRUCTION_PROMPT_VERSION: z
    .string()
    .default("reconstruct-v1"),
  RECONSTRUCTION_PIPELINE_VERSION: z
    .string()
    .default("reconstruct-pipeline-v1"),
  RECONSTRUCTION_TIMEOUT_MS: z
    .string()
    .default("25000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1000, {
      message: "RECONSTRUCTION_TIMEOUT_MS must be at least 1000ms",
    }),
  // Phase 10: AI-Assisted Evaluation Configuration
  EVALUATION_PROMPT_VERSION: z
    .string()
    .default("evaluation-v1"),
  EVALUATION_PIPELINE_VERSION: z
    .string()
    .default("evaluation-pipeline-v1"),
  EVALUATION_TIMEOUT_MS: z
    .string()
    .default("30000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1000, {
      message: "EVALUATION_TIMEOUT_MS must be at least 1000ms",
    }),
  // Phase 7: Answer Script Storage Configuration (Cloudinary / Mock)

  CLOUDINARY_CLOUD_NAME: z
    .string()
    .optional()
    .default(""),
  CLOUDINARY_API_KEY: z
    .string()
    .optional()
    .default(""),
  CLOUDINARY_API_SECRET: z
    .string()
    .optional()
    .default(""),
  STORAGE_PROVIDER: z
    .enum(["cloudinary", "mock"])
    .default("cloudinary"),
  MAX_SCRIPT_FILE_SIZE_BYTES: z
    .string()
    .default("26214400") // 25 MB default
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "MAX_SCRIPT_FILE_SIZE_BYTES must be a positive integer",
    }),
  // Phase 8: OCR & Document Processing Configuration
  OCR_PRIMARY_PROVIDER: z
    .enum(["google-vision", "mock"])
    .default("google-vision"),
  GOOGLE_CLOUD_PROJECT_ID: z
    .string()
    .optional()
    .default(""),
  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .optional()
    .default(""),
  GOOGLE_VISION_API_KEY: z
    .string()
    .optional()
    .default(""),
  OCR_REQUEST_TIMEOUT_MS: z
    .string()
    .default("25000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1000, {
      message: "OCR_REQUEST_TIMEOUT_MS must be at least 1000ms",
    }),
  OCR_PIPELINE_VERSION: z
    .string()
    .default("ocr-v1"),
  OCR_MAX_RETRIES: z
    .string()
    .default("2")
    .transform((val) => parseInt(val, 10)),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error("❌ [ANKLYZE] Invalid environment configuration:", JSON.stringify(formattedErrors, null, 2));
    
    // In production or when strictly required, throw error
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration. Check logs for details.");
    }
    
    // In development, provide a fallback with clear warning if DATABASE_URL is missing
    const fallbackDbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/anklyze_db?schema=public";
    console.warn("⚠️ [ANKLYZE] Using development configuration defaults.");
    
    return {
      NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
      PORT: parseInt(process.env.PORT || "8080", 10),
      API_PREFIX: process.env.API_PREFIX || "/api/v1",
      CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
      PUBLIC_FRONTEND_ORIGIN: process.env.PUBLIC_FRONTEND_ORIGIN || "https://anklyze-flame.vercel.app",
      DATABASE_URL: fallbackDbUrl,
      LOG_LEVEL: (process.env.LOG_LEVEL as "info") || "info",
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "anklyze_jwt_access_dev_secret_key_minimum_32_chars_2026",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "anklyze_jwt_refresh_dev_secret_key_minimum_32_chars_2026",
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      COOKIE_SECURE: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
      COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || "lax",
      AI_PRIMARY_PROVIDER: (process.env.AI_PRIMARY_PROVIDER as "gemini" | "groq" | "openrouter" | "mock") || "gemini",
      AI_FALLBACK_PROVIDER: (process.env.AI_FALLBACK_PROVIDER as "gemini" | "groq" | "openrouter" | "mock" | "none") || "groq",
      AI_PROVIDER_CHAIN: process.env.AI_PROVIDER_CHAIN || "gemini,groq,openrouter",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      GROQ_MODEL: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
      OPENROUTER_MODEL: (process.env.OPENROUTER_MODEL === "google/gemini-2.5-flash" ? undefined : process.env.OPENROUTER_MODEL) || "qwen/qwen3.8-27b",
      OPENROUTER_VISION_MODEL: (process.env.OPENROUTER_VISION_MODEL === "google/gemini-2.5-flash" ? undefined : process.env.OPENROUTER_VISION_MODEL) || "qwen/qwen3.8-27b",
      AI_REQUEST_TIMEOUT_MS: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "20000", 10),
      RUBRIC_PROMPT_VERSION: process.env.RUBRIC_PROMPT_VERSION || "rubric-analysis-v1",
      GEMINI_VISION_MODEL: process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash",
      GROQ_VISION_MODEL: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
      RECONSTRUCTION_PROMPT_VERSION: process.env.RECONSTRUCTION_PROMPT_VERSION || "reconstruct-v1",
      RECONSTRUCTION_PIPELINE_VERSION: process.env.RECONSTRUCTION_PIPELINE_VERSION || "reconstruct-pipeline-v1",
      RECONSTRUCTION_TIMEOUT_MS: parseInt(process.env.RECONSTRUCTION_TIMEOUT_MS || "25000", 10),
      EVALUATION_PROMPT_VERSION: process.env.EVALUATION_PROMPT_VERSION || "evaluation-v1",
      EVALUATION_PIPELINE_VERSION: process.env.EVALUATION_PIPELINE_VERSION || "evaluation-pipeline-v1",
      EVALUATION_TIMEOUT_MS: parseInt(process.env.EVALUATION_TIMEOUT_MS || "30000", 10),
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
      STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER as "cloudinary" | "mock") || "cloudinary",
      MAX_SCRIPT_FILE_SIZE_BYTES: parseInt(process.env.MAX_SCRIPT_FILE_SIZE_BYTES || "26214400", 10),
      OCR_PRIMARY_PROVIDER: (process.env.OCR_PRIMARY_PROVIDER as "google-vision" | "mock") || "google-vision",
      GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY || "",
      OCR_REQUEST_TIMEOUT_MS: parseInt(process.env.OCR_REQUEST_TIMEOUT_MS || "25000", 10),
      OCR_PIPELINE_VERSION: process.env.OCR_PIPELINE_VERSION || "ocr-v1",
      OCR_MAX_RETRIES: parseInt(process.env.OCR_MAX_RETRIES || "2", 10),
    };
  }

  if (!result.data.DATABASE_URL) {
    console.warn(
      "⚠️ [ANKLYZE] DATABASE_URL is not configured in environment variables. Database operations will fail until DATABASE_URL is provided in Cloud Run environment variables."
    );
  }

  if (result.data.NODE_ENV === "production") {
    const mockSettings = [
      result.data.STORAGE_PROVIDER === "mock" && "STORAGE_PROVIDER",
      result.data.OCR_PRIMARY_PROVIDER === "mock" && "OCR_PRIMARY_PROVIDER",
      result.data.AI_PRIMARY_PROVIDER === "mock" && "AI_PRIMARY_PROVIDER",
      result.data.AI_FALLBACK_PROVIDER === "mock" && "AI_FALLBACK_PROVIDER",
    ].filter(Boolean);
    if (mockSettings.length > 0) {
      throw new Error(`Mock providers are forbidden in production: ${mockSettings.join(", ")}`);
    }
  }

  return result.data;
}

export const config = validateEnv();
