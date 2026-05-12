/**
 * Chat service for talking to Groq's LLM API.
 * Adapted for bare React Native (uses @env via react-native-dotenv).
 *
 * Setup:
 * - Add GROQ_API_KEY=your_key to .env at the project root
 * - Restart Metro after editing .env
 */

import { GROQ_API_KEY } from '@env';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

const SYSTEM_PROMPT = `You are Nodi, a friendly assistant that helps users configure their notification preferences.

Your job is to chat with the user to understand which notifications matter to them — for example: family, work, urgent alerts, social media, promotions, etc.

Guidelines:
- Keep responses short and conversational (1-3 sentences max).
- Ask one clarifying question at a time when helpful.
- When the user describes preferences, summarize what you heard so they can confirm.
- Be warm but concise. Don't over-explain.`;

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error(
      'Missing GROQ_API_KEY. Add GROQ_API_KEY=... to .env and restart Metro.'
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected Groq API response shape');
  }
  return content.trim();
}