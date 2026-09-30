import { AIProviderResult } from '../types';
import { VisionReconstructionAIRequest } from '../visionTypes';

export interface EvaluationAIRequest {
  systemPrompt: string;
  userPrompt: string;
  pageImages?: Array<{ mimeType: string; base64Data: string }>;
  timeoutMs: number;
}

export interface IAIProvider {
  readonly providerName: string;
  readonly model: string;
  generateRubricAnalysis(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<AIProviderResult>;
  analyzeVisionContext?(
    request: VisionReconstructionAIRequest
  ): Promise<AIProviderResult>;
  evaluateAnswer?(
    request: EvaluationAIRequest
  ): Promise<AIProviderResult>;
}

