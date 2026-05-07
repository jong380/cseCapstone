/**
 * Backend client for the Nodi Express server (backEnd/index.js).
 *
 * The backend runs on port 3000 by default and exposes:
 *   POST /messages   - insert a row into the messages table
 *   GET  /messages   - list all rows ordered by time desc
 *
 * Setup:
 * 1. Start the backend in another terminal:
 *      cd backEnd && npm install && npm start
 * 2. Add EXPO_PUBLIC_BACKEND_URL to frontEnd/.env (see .env.example).
 *    - iOS simulator / web:   http://localhost:3000
 *    - Android emulator:      http://10.0.2.2:3000
 *    - Physical device:       http://<your-laptop-LAN-ip>:3000
 */

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export type SaveMessageInput = {
  /** ISO timestamp string (e.g. new Date().toISOString()). */
  time: string;
  /** The message body. */
  content: string;
  /** Where the message came from. For chat we use 'chat' or 'preferences'. */
  source: string;
  /** Who sent it. For chat we use 'user' or 'assistant'. */
  sender: string;
};

export type SavedMessage = SaveMessageInput & { id: number };

/**
 * Save a message to the backend.
 *
 * Network/server errors are caught and logged — they do NOT throw, so a
 * dead backend won't break the chat experience. Returns the inserted row id
 * on success, or null on any failure.
 */
export async function saveMessage(
  input: SaveMessageInput
): Promise<number | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[backend] saveMessage failed (${response.status}): ${errorText}`
      );
      return null;
    }

    const data = await response.json();
    return typeof data?.id === 'number' ? data.id : null;
  } catch (e) {
    // Network error, backend not running, etc. Log but don't throw.
    console.warn('[backend] saveMessage threw:', e);
    return null;
  }
}

/**
 * Retrieve all saved messages from the backend, newest first.
 * Returns [] on any failure.
 */
export async function listMessages(): Promise<SavedMessage[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/messages`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[backend] listMessages threw:', e);
    return [];
  }
}
