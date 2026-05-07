/**
 * Chat service for talking to Groq's LLM API.
 *
 * Setup:
 * 1. Get a free API key at https://console.groq.com
 * 2. Create frontEnd/.env with: EXPO_PUBLIC_GROQ_API_KEY=your_key_here
 * 3. Restart the Expo dev server (press `r` in the terminal) so the new env var loads.
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
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

/**
 * Send the conversation to Groq and get back the assistant's next message.
 *
 * @param messages The conversation so far (user/assistant turns only — the system prompt is added internally).
 * @returns The assistant's response text.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error(
      'Missing GROQ_API_KEY. Add EXPO_PUBLIC_GROQ_API_KEY to frontEnd/.env and restart the dev server.'
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
