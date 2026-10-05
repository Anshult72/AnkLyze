import { IAIProvider, EvaluationAIRequest } from './aiProvider.interface';
import { AIProviderResult, AIProviderError } from '../types';
import { VisionReconstructionAIRequest } from '../visionTypes';

export class GeminiProvider implements IAIProvider {
  public readonly providerName = 'gemini';
  public readonly model: string;
  public readonly visionModel: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, model?: string, visionModel?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    const rawModel = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.model = (rawModel === 'gemini-2.5-flash' || rawModel === 'gemini-flash-latest') ? 'gemini-1.5-flash' : rawModel;
    const rawVision = visionModel || process.env.GEMINI_VISION_MODEL || 'gemini-1.5-flash';
    this.visionModel = (rawVision === 'gemini-2.5-flash' || rawVision === 'gemini-flash-latest') ? 'gemini-1.5-flash' : rawVision;
  }

  async generateRubricAnalysis(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<AIProviderResult> {
    if (!this.apiKey) {
      throw new AIProviderError(
        'Gemini API key is not configured in environment',
        this.providerName,
        true // Treat missing config as transient so fallback Groq can be tried if configured
      );
    }

    const startTime = Date.now();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isTransient = response.status === 429 || (response.status >= 500 && response.status <= 599);
        throw new AIProviderError(
          `Gemini API error (HTTP ${response.status}): ${errorText.substring(0, 300)}`,
          this.providerName,
          isTransient,
          response.status
        );
      }

      const responseData: any = await response.json();
      const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new AIProviderError(
          'Gemini returned empty or malformed candidates response',
          this.providerName,
          false
        );
      }

      return {
        rawJsonText: candidateText,
        provider: this.providerName,
        model: this.model,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof AIProviderError) {
        throw err;
      }
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === 'ETIMEDOUT') {
        throw new AIProviderError(
          `Gemini request timed out after ${timeoutMs}ms`,
          this.providerName,
          true
        );
      }
      // Network/fetch errors are considered transient
      const isTransient = err.name === 'TypeError' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND';
      throw new AIProviderError(
        `Gemini provider network error: ${err.message}`,
        this.providerName,
        isTransient
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async analyzeVisionContext(
    request: VisionReconstructionAIRequest
  ): Promise<AIProviderResult> {
    if (!this.apiKey) {
      throw new AIProviderError(
        'Gemini API key is not configured in environment',
        this.providerName,
        true
      );
    }

    const startTime = Date.now();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.visionModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const promptInstructions = `
You are ANKLYZE's Answer Reconstruction Engine.
"Analyse the marks, not just the paper."
CRITICAL RULES:
1. DO NOT assign marks, score answers, or evaluate correctness.
2. Determine only structural information: which questions are on which pages, continuation, blanks, cancellations, duplicate attempts, or review requirements.
3. GROUNDING: Use only the supplied question IDs from the exam: ${request.questions.map(q => `${q.id} (${q.questionNumber}: ${q.questionText})`).join('; ')}. Never invent questions or page numbers.
4. Return ONLY a single JSON object conforming to the schema:
{
  "scriptId": "${request.scriptId}",
  "pages": [{ "pageId": "...", "pageNumber": 1, "questionCandidates": [{ "questionId": "...", "detectedLabel": "Q1", "confidence": 0.95 }] }],
  "attempts": [{ "questionId": "...", "attemptIndex": 1, "state": "ACTIVE", "pageIds": ["..."], "confidence": 0.95, "reason": "..." }],
  "reviewCases": [],
  "overallConfidence": 0.95
}
`;

    const userPrompt = `
Exam: ${request.examTitle}
Subject: ${request.subjectName} (${request.subjectCode})
Script: ${request.scriptCode}
Ambiguous Pages to Resolve:
${request.ambiguousPages.map(p => `--- PAGE ${p.pageNumber} (ID: ${p.pageId}, Quality: ${p.qualityScore ?? 1.0}) ---
OCR Text:
${p.ocrFullText}
Blocks summary: ${p.blocksSummary ?? 'N/A'}`).join('\n\n')}

Deterministic Candidates detected:
${JSON.stringify(request.deterministicCandidates ?? [], null, 2)}
`;

    const contentsParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: `${promptInstructions}\n\n${userPrompt}` }
    ];

    // If any page has inline base64 image data, include it
    for (const page of request.ambiguousPages) {
      if (page.imageBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: page.imageMimeType || 'image/jpeg',
            data: page.imageBase64,
          },
        });
      }
    }

    const payload = {
      contents: [{ role: 'user', parts: contentsParts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isTransient = response.status === 429 || (response.status >= 500 && response.status <= 599);
        throw new AIProviderError(
          `Gemini Vision API error (HTTP ${response.status}): ${errorText.substring(0, 300)}`,
          this.providerName,
          isTransient,
          response.status
        );
      }

      const responseData: any = await response.json();
      const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new AIProviderError(
          'Gemini Vision returned empty or malformed response',
          this.providerName,
          false
        );
      }

      return {
        rawJsonText: candidateText,
        provider: this.providerName,
        model: this.visionModel,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof AIProviderError) throw err;
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === 'ETIMEDOUT') {
        throw new AIProviderError(
          `Gemini Vision request timed out after ${request.timeoutMs}ms`,
          this.providerName,
          true
        );
      }
      const isTransient = err.name === 'TypeError' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND';
      throw new AIProviderError(
        `Gemini Vision provider network error: ${err.message}`,
        this.providerName,
        isTransient
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async evaluateAnswer(
    request: EvaluationAIRequest
  ): Promise<AIProviderResult> {
    if (!this.apiKey) {
      throw new AIProviderError(
        'Gemini API key is not configured in environment',
        this.providerName,
        true
      );
    }

    const startTime = Date.now();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.visionModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const contentsParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: `${request.systemPrompt}\n\n${request.userPrompt}` }
    ];

    // Include page images for multimodal evaluation
    if (request.pageImages) {
      for (const img of request.pageImages) {
        contentsParts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64Data,
          },
        });
      }
    }

    const payload = {
      contents: [{ role: 'user', parts: contentsParts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isTransient = response.status === 429 || (response.status >= 500 && response.status <= 599);
        throw new AIProviderError(
          `Gemini Evaluation API error (HTTP ${response.status}): ${errorText.substring(0, 300)}`,
          this.providerName,
          isTransient,
          response.status
        );
      }

      const responseData: any = await response.json();
      const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new AIProviderError(
          'Gemini Evaluation returned empty or malformed response',
          this.providerName,
          false
        );
      }

      return {
        rawJsonText: candidateText,
        provider: this.providerName,
        model: this.visionModel,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof AIProviderError) throw err;
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === 'ETIMEDOUT') {
        throw new AIProviderError(
          `Gemini Evaluation request timed out after ${request.timeoutMs}ms`,
          this.providerName,
          true
        );
      }
      const isTransient = err.name === 'TypeError' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND';
      throw new AIProviderError(
        `Gemini Evaluation provider network error: ${err.message}`,
        this.providerName,
        isTransient
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

