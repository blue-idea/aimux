import { sendChatCompletion, type LlmApiConfig, type ChatMessage } from './llmApi';

export const OPTIMIZATION_SYSTEM_PROMPT = `You are a world-class Prompt Engineer.
Your task is to rewrite and optimize the user's input prompt to achieve maximum clarity, precision, and effectiveness when sent to advanced AI models.
Rules:
1. Maintain the user's original intent and core domain terminology.
2. Keep the exact language of the user's input (respond in Chinese if input is Chinese, English if input is English).
3. Enhance structure with clear roles, objectives, and output format expectations where appropriate.
4. Output ONLY the optimized prompt text directly, with NO surrounding markdown quotes, NO preamble, and NO meta commentary.`;

export const EXPANSION_SYSTEM_PROMPT = `You are an expert AI prompt strategist.
Your task is to enrich and expand the user's brief prompt by providing comprehensive contextual background, explicit constraints, edge cases, and step-by-step reasoning directives.
Rules:
1. Expand the user's core question into a deeply specified, highly actionable multi-part instruction.
2. Keep the exact language of the user's input (Chinese if input is Chinese, English if input is English).
3. Output ONLY the expanded prompt text directly, with NO conversational preamble and NO explanation.`;

/**
 * 针对用户输入的 Prompt 进行清晰度与结构重构优化
 */
export async function optimizePrompt(
  promptText: string,
  config: LlmApiConfig,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const trimmed = promptText.trim();
  if (!trimmed) {
    throw new Error('Prompt text cannot be empty');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: OPTIMIZATION_SYSTEM_PROMPT },
    { role: 'user', content: trimmed },
  ];

  const result = await sendChatCompletion(config, messages, fetchImpl);
  return result.trim();
}

/**
 * 针对用户输入的 Prompt 进行上下文与约束条件扩充补充
 */
export async function expandPrompt(
  promptText: string,
  config: LlmApiConfig,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const trimmed = promptText.trim();
  if (!trimmed) {
    throw new Error('Prompt text cannot be empty');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: EXPANSION_SYSTEM_PROMPT },
    { role: 'user', content: trimmed },
  ];

  const result = await sendChatCompletion(config, messages, fetchImpl);
  return result.trim();
}
