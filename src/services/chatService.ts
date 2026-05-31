import { getLlamaContext } from '../logic/ClassificationService';


export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

const BASE_SYSTEM_PROMPT = `You are Nodi, a friendly assistant that helps users configure their notification preferences.

Your job is to chat with the user to understand which notifications matter to them — for example: family, work, urgent alerts, social media, promotions, etc.

Guidelines:
- Keep responses short and conversational (1-3 sentences max).
- Ask one clarifying question at a time when helpful.
-When the user tells you what they want, ALWAYS confirm back exactly what you will prioritize and what you will suppress — so they can correct you if needed.
- Be warm but concise. Don't over-explain.
- Once you understand the user's preferences, end your reply with a new line starting with exactly "PREFERENCES:" followed by a one-sentence summary. Example: "PREFERENCES: Prioritize family, work messages, and urgent alerts; suppress promotions, social media, and newsletters."
- If the user asks to reset, clear, or delete their preferences, end your reply with exactly "CLEAR_PREFERENCES" on its own line.`;

function buildSystemPrompt(currentPreferences?: string | null): string {
  if (!currentPreferences) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}\n\nThe user's current preferences are: "${currentPreferences}". Reference these when they ask what's set or want to update them.`;
}

function buildPrompt(messages: ChatMessage[], currentPreferences?: string | null): string {
  let prompt = `<|im_start|>system\n${buildSystemPrompt(currentPreferences)}\n<|im_end|>\n`;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLastUser = msg.role === 'user' && i === messages.length - 1;
    if (msg.role === 'user') {
      prompt += `<|im_start|>user\n${msg.content}${isLastUser ? ' /no_think' : ''}\n<|im_end|>\n`;
    } else if (msg.role === 'assistant') {
      prompt += `<|im_start|>assistant\n${msg.content}\n<|im_end|>\n`;
    }
  }
  prompt += `<|im_start|>assistant\n`;
  return prompt;
}

export async function sendChatMessage(messages: ChatMessage[], currentPreferences?: string | null): Promise<string> {
  const llamaContext = getLlamaContext();
  if (!llamaContext) {
    throw new Error('Qwen model not loaded yet. Please wait a moment and try again.');
  }

  const result = await llamaContext.completion({
    prompt: buildPrompt(messages, currentPreferences),
    n_predict: 200,
    temperature: 0.7,
    stop: ['<|im_end|>', '<|im_start|>'],
  });

  console.log('Qwen raw reply:', result.text);
    return result.text.trim();
}