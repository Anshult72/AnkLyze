import assert from 'node:assert/strict';
import { GeminiProvider } from '../ai/providers/geminiProvider';
import { GroqProvider } from '../ai/providers/groqProvider';
import { VisionReconstructionAIRequest } from '../ai/visionTypes';

const originalFetch = globalThis.fetch;
const request: VisionReconstructionAIRequest = {
  scriptId: 'sheet-1', scriptCode: 'A-001', subjectCode: 'SOC', subjectName: 'Social Science',
  examTitle: 'Class 10', questions: [], task: 'Identify answer boundaries', timeoutMs: 1000,
  ambiguousPages: [{ pageId: 'page-1', pageNumber: 1, ocrFullText: 'Q1', ocrConfidence: 0.8,
    imageBase64: Buffer.from([137, 80, 78, 71]).toString('base64'), imageMimeType: 'image/png' }],
};

async function run() {
  const captured: any[] = [];
  try {
    globalThis.fetch = (async (_url: any, init: any) => {
      captured.push(JSON.parse(init.body));
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: '{}' }] } }],
          choices: [{ message: { content: '{}' } }] }),
      } as any;
    }) as typeof fetch;
    await new GeminiProvider('test-key').analyzeVisionContext(request);
    await new GroqProvider('test-key').analyzeVisionContext(request);
    const geminiImage = captured[0].contents[0].parts.find((part: any) => part.inlineData);
    const groqImage = captured[1].messages[1].content.find((part: any) => part.type === 'image_url');
    assert.equal(geminiImage.inlineData.mimeType, 'image/png');
    assert.equal(geminiImage.inlineData.data, request.ambiguousPages[0].imageBase64);
    assert.equal(groqImage.image_url.url, `data:image/png;base64,${request.ambiguousPages[0].imageBase64}`);
    console.log('Vision providers attach real PNG bytes with matching MIME type: PASS');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
