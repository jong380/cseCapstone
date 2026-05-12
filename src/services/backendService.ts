/**
 * Backend client for the Nodi Express server.
 * Adapted for bare React Native (uses @env via react-native-dotenv).
 *
 * Setup:
 * - Add BACKEND_URL=http://<your-laptop-IP>:3000 to .env (or 10.0.2.2:3000 for emulator)
 */

import { BACKEND_URL } from '@env';

const BASE = (BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export type SaveMessageInput = {
  time: string;
  content: string;
  source: string;
  sender: string;
  status?: string;
};

export type SavedMessage = SaveMessageInput & { id: number; status: string };

export async function saveMessage(
  input: SaveMessageInput
): Promise<number | null> {
  try {
    const response = await fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      console.warn(`[backend] saveMessage failed (${response.status})`);
      return null;
    }
    const data = await response.json();
    return typeof data?.id === 'number' ? data.id : null;
  } catch (e) {
    console.warn('[backend] saveMessage threw:', e);
    return null;
  }
}

export async function listMessages(): Promise<SavedMessage[]> {
  try {
    const response = await fetch(`${BASE}/messages`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[backend] listMessages threw:', e);
    return [];
  }
}