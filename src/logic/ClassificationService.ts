// We are using llama instead of onnx, so that we can run Qwen3 0.6B
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs'; // Add this import

// These are the main strings that are used to classify notifications, and will be the outputs that Qwen (the LM) will use.
export type Priority = 'important' | 'unimportant';

// We only want to initialize one Qwen instance, so a sanity check will go here
let llamaContext: LlamaContext | null = null;
let isInitializing = false; // Prevent double initialization attempts

// We keep all emergency keywords that may constitute an urgent notification
function keywordUrgency(text: string): boolean {
     if (!text) return false;
  const urgent = ['emergency', 'amber', 'alert', 'urgent', 'missed call', 'fraud',
                  'earthquake', 'tornado', 'flood', 'missing', '911', 'warning',
                  'payment due', 'low balance', 'suspicious', 'security', 'password reset',
                  'are you okay', 'please respond', 'we need to talk', 'call me'];
  const lower = text.toLowerCase();
  return urgent.some(k => lower.includes(k));
}

// Initalizes one classifier
export async function initializeClassifier(): Promise<void> {
  if (llamaContext || isInitializing) return;
  isInitializing = true;

  // Dynamically resolve the absolute path to the app's documents folder (This is where qwen is stored on the device)
  const modelPath = `${RNFS.DocumentDirectoryPath}/qwen.gguf`;
  console.log("Checking for model file at:", modelPath);

  // We expect the model to already be in Nodi files, see reference in README for how to install Qwen3
  try {
    const fileExists = await RNFS.exists(modelPath);
    if (!fileExists) {
      console.error(`Model file not found at ${modelPath}. Run adb commands again!`);
      isInitializing = false;
      return;
    }

    // More sanity checks to see if model is there.
    const fileStat = await RNFS.stat(modelPath);
    console.log(`Model file found! Size: ${(parseInt(fileStat.size) / (1024 * 1024)).toFixed(2)} MB`);

    // We initalize Llama and only use limit to 2 cores, so that we don't run out of memory or prevent app freezing
    console.log("Initializing Llama engine natively...");
    llamaContext = await initLlama({
      model: modelPath,
      use_mlock: true,
      n_ctx: 512,
      n_threads: 2,
    });
    // Make sure Qwen is loaded from local file that is stored on device.
    console.log("SUCCESS: Qwen GGUF model loaded into memory!");
  } catch (e) {
    console.error("Failed to load Llama model:", e);
  } finally {
    isInitializing = false;
  }
}
// Classifies a notification based on its source, title, and content. We don't need to tokenize words anymore since Qwen is better and can be edited via prompting.
export async function classifyNotification(
  source: string,
  title: string,
  content: string,
): Promise<Priority> {
  const combined = `${source} ${title} ${content}`;

  if (keywordUrgency(combined)) return 'important';

  // Sanity Check to make sure Llama/Qwen is ready or not.
  if (!llamaContext) {
    console.warn("Llama context not ready. Defaulting to unimportant.");
    return 'unimportant';
  }
  // This is the prompt that Qwen3 follows to classify notifications. We want to tune this to balance the need for seperating our notifications
  // Into Important and Unimportant.
  const prompt = `<|im_start|>system
You are a highly intelligent notification classifier. Output ONLY "important" or "unimportant". Do not explain your reasoning.

RULES FOR "important":
- Real human emergencies, health, or physical safety.
- Time-critical logistics (flights boarding, lockouts, being stranded).
- Real security breaches or server outages.

RULES FOR "unimportant":
- ALL marketing, food delivery, or store promotions (IGNORE buzzwords like "URGENT", "CRITICAL", or "ALERT" if it is just an ad).
- Social media likes, casual group chats, or media updates.
- Routine system background updates.<|im_end|>
<|im_start|>user
Source: ${source} | Title: ${title} | Content: ${content}<|im_end|>
<|im_start|>assistant
`;

  try {
    const result = await llamaContext.completion({
      prompt,
      n_predict: 5,
      temperature: 0.0,
    });
    // We can see what Qwen thinks, and classifies each notification through this debugging log.
    const output = result.text.toLowerCase().trim();
    return output.includes('important') && !output.includes('unimportant')
      ? 'important'
      : 'unimportant';

  } catch (e) {
    console.error('Llama inference error:', e);
    return 'unimportant';
  }
}