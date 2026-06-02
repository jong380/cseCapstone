// We are using llama instead of onnx, so that we can run Qwen 0.6B
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs';
import { getPreferences } from './PreferenceStore';

export type Priority = 'important' | 'unimportant';

let llamaContext: LlamaContext | null = null;
let isInitializing = false;
let isProcessing = false;  // Prevents the app from freezing if 5 notifications arrive at once

const CRITICAL_APPS = new Set([
'com.pagerduty.android',
'com.scoutalarm'
]);

/*
This is a new hybrid approach that can help cut down on computation time and battery, as well as increase accuracy.
Stage 1: This function that scans for common marketing/spam text, and will be automatically blocked.
Stage 2: This function that scans for emergency apps (ex. home security), and will be automatically allowed.
Stage 3: This function scans for emergency keywords in other apps, and will be automatically allowed.
Stage 4: If fully ambiguous, then we send to Qwen for processing.
*/

// We feed each app notification into a series of sample common buckets to account for all apps
const APP_CONTEXT_ENRICHMENT: Record<string, string> = {
'Messages': 'Android Messages (SMS/Text)',
  'Voice': 'Google Voice (SMS/Text)',
  'WhatsApp': 'WhatsApp (Direct Messaging)',
  'Discord': 'Discord (Chat/Messaging)',
  'Instagram': 'Instagram (Social Media)',
  'Snapchat': 'Snapchat (Social Media)',
  'Canvas Student': 'Canvas (School/Education App)',
  'Temu': 'Temu (Shopping/E-commerce)',
  'AliExpress': 'AliExpress (Shopping/E-commerce)'
};

// Stage 1 function that will catch spam/marketing/promotion text
function isMarketingOrPromo(source: string, text: string): boolean {
  const lowerSource = source.toLowerCase();
  const lowerText = text.toLowerCase();

  const spammyPackageKeywords = [
    'eats', 'food', 'delivery', 'shop', 'store', 'deal',
    'news', 'game', 'social', 'tiktok', 'snapchat',
    'temu', 'aliexpress', 'shein'
  ];
  if (spammyPackageKeywords.some(kw => lowerSource.includes(kw))) return true;

  const promoPatterns = [
    '\\b\\d+% off\\b', '\\$\\d+ off\\b', '\\bfree delivery\\b', '\\bfree shipping\\b',
    '\\blimited time\\b', '\\bflash sale\\b', '\\buse code\\b', '\\bdiscount\\b',
    '\\bpromo\\b', '\\bspecial offer\\b'
  ];
  const promoRegex = new RegExp(promoPatterns.join('|'), 'i');
  return promoRegex.test(lowerText);
}

// Checks for emergency keywords and if detected will show important notification
function containsEmergencyKeyword(text: string): boolean {
  if (!text) return false;
  const urgentPatterns = [
    '\\bemergency\\b', '\\bamber alert\\b', '\\bearthquake\\b', '\\btornado\\b', '\\b911\\b',
    '\\bfraud\\b', '\\bsuspicious login\\b', '\\bpassword reset\\b',
    '\\bare you okay\\b', '\\bplease respond\\b', '\\bcall me\\b', '\\bhospital\\b'
  ];
  return new RegExp(urgentPatterns.join('|'), 'i').test(text);
}

// We initalize Qwen here
export async function initializeClassifier(): Promise<void> {
  if (llamaContext || isInitializing) return;
  isInitializing = true;

  // Sanity check to look for Qwen local installation
  const modelPath = `${RNFS.DocumentDirectoryPath}/qwen.gguf`;
  console.log("Checking for model file at:", modelPath);

  try {
    const fileExists = await RNFS.exists(modelPath);
    if (!fileExists) {
      console.error(`Model file not found at ${modelPath}`);
      isInitializing = false;
      return;
    }
    console.log("Initializing Llama engine natively...");
    llamaContext = await initLlama({
      model: modelPath,
      use_mlock: false,
      n_ctx: 512,
      n_threads: 4,     // Limit to 2 cores to keep React Native responsive
    });
    console.log("SUCCESS: Qwen GGUF model loaded into memory!");
  } catch (e) {
    console.error("Failed to load Llama model:", e);
  } finally {
    isInitializing = false;
  }
}

// We queue notifications one by one so that each can get processed without freezing the app
interface QueueItem {
  source: string;
  title: string;
  content: string;
  resolve: (value: Priority) => void;
}

const aiQueue: QueueItem[] = [];

async function processAiQueue() {
  if (isProcessing || aiQueue.length === 0) return;

  isProcessing = true;
  const item = aiQueue.shift(); // Pull the oldest notification from the queue

  if (!item) {
    isProcessing = false;
    return;
  }

  console.log(`AI Processing: ${item.title} (${aiQueue.length} items left in queue)`);

  try {
    const preferences = await getPreferences();
    const prefLine = preferences ? `\nThe user's personal filtering preferences: ${preferences}\n` : '';

    const prompt = `<|im_start|>system
You are a strict notification sorting API. Evaluate the incoming text message.
Your internal monologue must be brief. You must append your absolute final decision wrapped exactly in bracket keys at the very end: [VERDICT: ALLOW] or [VERDICT: SUPPRESS].${prefLine}

Rules:
- Personal human communication, direct chat messages, DMs, calendar events, Group chats, team channels, or flight changes must be ALLOWed.
- Automated logs, app status pings, shopping alerts, or system status must be SUPPRESSed.
- If the Source is an SMS/Chat app and the Title is a phone number or contact name, it is a human text message and MUST be ALLOWed.
<|im_end|>
<|im_start|>user
Source: messages | Title: Mom | Content: Are you coming home for dinner?
<|im_end|>
<|im_start|>assistant
<THINK>This is a direct text message from a personal human contact asking a question.</THINK> [VERDICT: ALLOW]<|im_end|>
<|im_start|>user
Source: ${item.source} | Title: ${item.title} | Content: ${item.content}
<|im_end|>
<|im_start|>assistant
`;

    const result = await llamaContext!.completion({
      prompt,
      n_predict: 200,
      temperature: 0.0,
      stop: ["<|im_end|>"],
    });

    const output = result.text.trim();
    console.log(`Qwen raw output:\n${output}`);

    if (output.includes("[VERDICT: ALLOW]")) {
      item.resolve('important');
    } else if (output.includes("[VERDICT: SUPPRESS]")) {
      item.resolve('unimportant');
    } else {
      item.resolve(output.toLowerCase().includes('allow') ? 'important' : 'unimportant');
    }

  } catch (e) {
    console.error('Llama inference error:', e);
    item.resolve('unimportant');
  } finally {
    isProcessing = false;
    processAiQueue(); // Instantly loop back and process the next item in the queue
  }
}



// Classify notification based on hybrid approach and LLM
export async function classifyNotification(
  source: string,
  title: string,
  content: string,
): Promise<Priority> {

  // Stage 0: Drop empty notifications
  if (!content || content.trim() === '') {
    console.log(`[Stage 0] Auto-dropped empty system background ping: ${title}`);
    return 'unimportant';
  }

  const combinedText = `${title} ${content}`;

  // Stage 1: Marketing/Promotion Finder
  if (isMarketingOrPromo(source, combinedText)) {
    console.log(`[Stage 1] Auto-dropped promo/marketing trap from (${source})`);
    return 'unimportant';
  }

  // Stage 2: Allow Emergency Apps
  if (CRITICAL_APPS.has(source)) {
    console.log(`[Stage 2] Auto-passed critical system source (${source})`);
    return 'important';
  }

  // Stage 3: Allow Emergency Keywords
  if (containsEmergencyKeyword(combinedText)) {
    console.log('[Stage 3] Critical Keyword Detected in app');
    return 'important';
  }

  // Stage 4: Deploy Qwen
  if (!llamaContext) {
    console.warn("Llama context not ready. Defaulting to unimportant.");
    return 'unimportant';
  }

  // Grab the source from the App Name
  let semanticSource = APP_CONTEXT_ENRICHMENT[source];
  if (!semanticSource) {
    if (source.includes('.')) {
      const parts = source.split('.');
      semanticSource = parts.length > 2 ? parts[1] : parts[0];
    } else {
      semanticSource = source;
    }
  }
  semanticSource = semanticSource.charAt(0).toUpperCase() + semanticSource.slice(1);

  // Push each notificcation into queue to be processed
  return new Promise((resolve) => {
    aiQueue.push({ source: semanticSource, title, content, resolve });
    processAiQueue(); // Kickstart the queue if it's idle
  });
}

export function getLlamaContext() {
  return llamaContext;
}