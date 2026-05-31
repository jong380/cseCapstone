// We are using llama instead of onnx, so that we can run Qwen3 0.6B
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs';
import { getPreferences } from './PreferenceStore';

export type Priority = 'important' | 'unimportant';

let llamaContext: LlamaContext | null = null;
let isInitializing = false;
let isProcessing = false; // Prevents the app from freezing if 5 notifications arrive at once

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

// Stage 1 function that will catch spam/marketing/promotion text
function isMarketingOrPromo(source: string, text: string): boolean {
  const lowerSource = source.toLowerCase();
  const lowerText = text.toLowerCase();

  const spammyPackageKeywords = [
    'eats', 'food', 'delivery', 'shop', 'store', 'deal',
    'news', 'game', 'social', 'tiktok', 'snapchat'
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

// Checks for emergency keywords and if detected will return important notification
function containsEmergencyKeyword(text: string): boolean {
  if (!text) return false;

  const urgentPatterns = [
    '\\bemergency\\b', '\\bamber alert\\b', '\\bearthquake\\b', '\\btornado\\b', '\\b911\\b',
    '\\bfraud\\b', '\\bsuspicious login\\b', '\\bpassword reset\\b',
    '\\bare you okay\\b', '\\bplease respond\\b', '\\bcall me\\b', '\\bhospital\\b'
  ];

  const regex = new RegExp(urgentPatterns.join('|'), 'i');
  return regex.test(text);
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
      console.error(`Model file not found at ${modelPath}. Run adb commands again!`);
      isInitializing = false;
      return;
    }

    const fileStat = await RNFS.stat(modelPath);
    console.log(`Model file found! Size: ${(parseInt(fileStat.size) / (1024 * 1024)).toFixed(2)} MB`);

    console.log("Initializing Llama engine natively...");
    llamaContext = await initLlama({
      model: modelPath,
      use_mlock: false,
      n_ctx: 512,
      n_threads: 2,     // Limit to 2 cores to keep React Native responsive
    });
    console.log("SUCCESS: Qwen GGUF model loaded into memory!");
  } catch (e) {
    console.error("Failed to load Llama model:", e);
  } finally {
    isInitializing = false;
  }
}


// Classify notification based on hybrid approach and LLM
export async function classifyNotification(
  source: string,
  title: string,
  content: string,
): Promise<Priority> {

  const combinedText = `${title} ${content}`;

  // Stage 1: Marketing/Promotion Finder
  if (isMarketingOrPromo(source, combinedText)) {
    console.log(`Auto-dropped promo/marketing trap from (${source})`);
    return 'unimportant';
  }

  // Stage 2: Allow Emergency Apps
  if (CRITICAL_APPS.has(source)) {
    console.log(`Auto-passed critical system source (${source})`);
    return 'important';
  }

  // Stage 3: Allow Emergency Keywords
  if (containsEmergencyKeyword(combinedText)) {
    console.log('Critical Keyword Detected in trusted/ambiguous app');
    return 'important';
  }

  // Stage 4: Deploy Qwen
  if (!llamaContext) {
    console.warn("Llama context not ready. Defaulting to unimportant.");
    return 'unimportant';
  }

  if (isProcessing) {
    console.warn("AI is busy. Skipping to prevent freeze.");
    return 'unimportant';
  }

  isProcessing = true;

  // Return cleaned up app package name for Qwen
  const cleanSource = source.includes('.') ? source.split('.')[1] : source;

  console.log(`Routing to Qwen LLM for deep analysis...`);

  // Prompt that gives Qwen specific instructions on how to classify notifications
 const preferences = await getPreferences();
 const prefLine = preferences
   ? `\nThe user's personal preferences: ${preferences}\n`
   : '';

 const prompt = `Classify the following notifications as either "important" or "unimportant".${prefLine}

Source: Mom | Title: Mom | Content: I am at the hospital right now, please call me.
Answer: important

Source: UberEats | Title: CRITICAL HUNGER ALERT | Content: Order now for 50% off tacos!
Answer: unimportant

Source: instagram | Title: Group Chat | Content: Me when I lie about the homework.
Answer: unimportant

Source: Delta Airlines | Title: Gate Change | Content: Boarding begins in 10 minutes.
Answer: important

Source: ${cleanSource} | Title: ${title} | Content: ${content}
Answer:`;

  try {
    const result = await llamaContext.completion({
      prompt,
      n_predict: 10,
      temperature: 0.0,
      stop: ["\n", "Source:"],
    });

    const output = result.text.toLowerCase().trim();
    return output.includes('important') && !output.includes('unimportant')
      ? 'important'
      : 'unimportant';

  } catch (e) {
    console.error('Llama inference error:', e);
    return 'unimportant';
  } finally {
    isProcessing = false;
  }
}
export function getLlamaContext() {
  return llamaContext;
}