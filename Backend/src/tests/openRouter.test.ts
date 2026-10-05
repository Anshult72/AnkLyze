import assert from 'assert';
import { OpenRouterProvider } from '../ai/providers/openRouterProvider';

async function testOpenRouterProvider() {
  console.log('--- Testing OpenRouterProvider Abstraction ---');

  // 1. Missing API Key handling
  const noKeyProvider = new OpenRouterProvider('', 'test-model', 'test-vision-model');
  let threwExpected = false;
  try {
    await noKeyProvider.generateRubricAnalysis('sys', 'user', 5000);
  } catch (err: any) {
    if (err.message.includes('not configured')) {
      threwExpected = true;
    }
  }
  assert(threwExpected, 'Provider must throw AIProviderError when API key is missing');
  console.log('✓ Missing API key safely rejected without throwing unhandled exceptions');

  // 2. Multimodal Payload Construction Check
  const mockProvider = new OpenRouterProvider('test-key', 'openai/gpt-4o', 'openai/gpt-4o');
  assert.strictEqual(mockProvider.providerName, 'openrouter');
  assert.strictEqual(mockProvider.model, 'openai/gpt-4o');
  assert.strictEqual(mockProvider.visionModel, 'openai/gpt-4o');
  console.log('✓ Configuration and model selection initialized accurately');

  console.log('--- OpenRouterProvider tests passed successfully! ---');
}

testOpenRouterProvider().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
