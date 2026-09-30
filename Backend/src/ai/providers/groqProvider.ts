import { IAIProvider, EvaluationAIRequest } from './aiProvider.interface';
import { AIProviderResult, AIProviderError } from '../types';
import { VisionReconstructionAIRequest } from '../visionTypes';

export class GroqProvider implements IAIProvider {
  public readonly providerName = 'groq';
  public readonly model: string;
  public readonly visionModel: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, model?: string, visionModel?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    this.model = model || process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
    this.visionModel = visionModel || process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b';
  }

  async generateRubricAnalysis(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<AIProviderResult> {
    if (!this.apiKey) {
      throw new AIProviderError(
        'Groq API key is not configured in environment',
        this.providerName,
        false
      );
    }

    const startTime = Date.now();
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isTransient = response.status === 429 || (response.status >= 500 && response.status <= 599);
        throw new AIProviderError(
          `Groq API error (HTTP ${response.status}): ${errorText.substring(0, 300)}`,
          this.providerName,
          isTransient,
          response.status
        );
      }

      const responseData: any = await response.json();
      const messageContent = responseData.choices?.[0]?.message?.content;

      if (!messageContent) {
        throw new AIProviderError(
          'Groq returned empty message choices response',
          this.providerName,
          false
        );
      }

      return {
        rawJsonText: messageContent,
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
          `Groq request timed out after ${timeoutMs}ms`,
          this.providerName,
          true
        );
      }
      const isTransient = err.name === 'TypeError' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND';
      throw new AIProviderError(
        `Groq provider network error: ${err.message}`,
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
        'Groq API key is not configured in environment',
        this.providerName,
        false
      );
    }

    const startTime = Date.now();
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const systemPrompt = `You are ANKLYZE's Answer Reconstruction Engine.
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
}`;

    const userPrompt = `Exam: ${request.examTitle}
Subject: ${request.subjectName} (${request.subjectCode})
Script: ${request.scriptCode}
Ambiguous Pages to Resolve:
${request.ambiguousPages.map(p => `--- PAGE ${p.pageNumber} (ID: ${p.pageId}) ---
OCR Text:
${p.ocrFullText}`).join('\n\n')}

Deterministic Candidates detected:
${JSON.stringify(request.deterministicCandidates ?? [], null, 2)}`;

    const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: userPrompt }
    ];

    for (const page of request.ambiguousPages) {
      if (page.imageBase64) {
        userMessageContent.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${page.imageBase64}`
          }
        });
      }
    }

    const payload = {
      model: this.visionModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isTransient = response.status === 429 || (response.status >= 500 && response.status <= 599);
        throw new AIProviderError(
          `Groq Vision API error (HTTP ${response.status}): ${errorText.substring(0, 300)}`,
          this.providerName,
          isTransient,
          response.status
        );
      }

      const responseData: any = await response.json();
      const messageContent = responseData.choices?.[0]?.message?.content;

      if (!messageContent) {
        throw new AIProviderError(
          'Groq Vision returned empty message choices response',
          this.providerName,
          false
        );
      }

      return {
        rawJsonText: messageContent,
        provider: this.providerName,
        model: this.visionModel,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof AIProviderError) throw err;
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === 'ETIMEDOUT') {
        throw new AIProviderError(
          `Groq Vision request timed out after ${request.timeoutMs}ms`,
          this.providerName,
          true
        );
      }
      const isTransient = err.name === 'TypeError' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND';
      throw new AIProviderError(
        `Groq Vision provider network error: ${err.message}`,
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
        'Groq API key is not configured in environment',
        this.providerName,
        true
      );
    }

    const startTime = Date.now();
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const userMessageContent: any[] = [
      { type: 'text', text: `${request.systemPrompt}\n\n${request.userPrompt}` }
    ];

    if (request.pageImages && request.pageImages.length > 0) {
      for (const img of request.pageImages) {
        userMessageContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType};base64,${img.base64Data}`
          }
        });
      }
    }

    const payload = {
      model: this.visionModel,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const isTransient = response.status === 429 || (response.status >= 500 && response.status <= 599);
        throw new AIProviderError(
          `Groq Evaluation API error (HTTP ${response.status}): ${errorText.substring(0, 300)}`,
          this.providerName,
          isTransient,
          response.status
        );
      }

      const responseData: any = await response.json();
      const messageContent = responseData.choices?.[0]?.message?.content;

      if (!messageContent) {
        throw new AIProviderError(
          'Groq Evaluation returned empty message choices response',
          this.providerName,
          false
        );
      }

      return {
        rawJsonText: messageContent,
        provider: this.providerName,
        model: this.visionModel,
        latencyMs,
      };
    } catch (err: any) {
      if (err instanceof AIProviderError) throw err;
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === 'ETIMEDOUT') {
        throw new AIProviderError(
          `Groq Evaluation request timed out after ${request.timeoutMs}ms`,
          this.providerName,
          true
        );
      }
      const isTransient = err.name === 'TypeError' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND';
      throw new AIProviderError(
        `Groq Evaluation provider network error: ${err.message}`,
        this.providerName,
        isTransient
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}


