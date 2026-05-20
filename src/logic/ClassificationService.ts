export type Priority = 'important' | 'unimportant';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';

let session: InferenceSession | null = null;
let vocab: Map<string, number> | null = null;

async function loadVocab(): Promise<Map<string, number>> {
  if (vocab) return vocab;
  const text = await RNFS.readFileAssets('vocab.txt', 'utf8');
  const lines = text.split('\n');
  vocab = new Map(lines.map((token, i) => [token.trim(), i]));
  return vocab;
}
function keywordUrgency(text: string): boolean {
     if (!text) return false;
  const urgent = ['emergency', 'amber', 'alert', 'urgent', 'missed call', 'fraud',
                  'earthquake', 'tornado', 'flood', 'missing', '911', 'warning',
                  'payment due', 'low balance', 'suspicious', 'security', 'password reset',
                  'are you okay', 'please respond', 'we need to talk', 'call me'];
  const lower = text.toLowerCase();
  return urgent.some(k => lower.includes(k));
}

function tokenize(text: string, vocab: Map<string, number>): { input_ids: number[], attention_mask: number[] } {
  const UNK = 100, CLS = 101, SEP = 102;
  const words = text.toLowerCase().trim().split(/\s+/).slice(0, 126);

  const ids: number[] = [CLS];
  for (const word of words) {
    if (vocab.has(word)) {
      ids.push(vocab.get(word)!);
    } else {
      // try WordPiece subword splitting
      let remaining = word;
      let found = false;
      const subwords: number[] = [];

      while (remaining.length > 0) {
        let matched = false;
        for (let end = remaining.length; end > 0; end--) {
          const substr = subwords.length === 0 ? remaining.slice(0, end) : `##${remaining.slice(0, end)}`;
          if (vocab.has(substr)) {
            subwords.push(vocab.get(substr)!);
            remaining = remaining.slice(end);
            matched = true;
            break;
          }
        }
        if (!matched) { subwords.push(UNK); break; }
      }
      ids.push(...subwords);
    }
  }
  ids.push(SEP);

  const trimmed = ids.slice(0, 128);
  return { input_ids: trimmed, attention_mask: trimmed.map(() => 1) };
}

async function loadModel(): Promise<InferenceSession> {
  if (!session) {
    const destPath = `${RNFS.DocumentDirectoryPath}/model.onnx`;
    const exists = await RNFS.exists(destPath);
    if (!exists) {
      await RNFS.copyFileAssets('model.onnx', destPath);
    }
    session = await InferenceSession.create(`file://${destPath}`);
  }
  return session;
}

export async function classifyNotification(
  _source: string,
  _title: string,
  _content: string,
): Promise<Priority> {
     // keyword check first
      if (keywordUrgency(text)) return 'important';

  const [sess, v] = await Promise.all([loadModel(), loadVocab()]);
  const text = `title: ${_title ?? ''} | content: ${_content ?? ''} | sender: ${_source ?? ''} | source: ${_source ?? ''}`;
  const { input_ids, attention_mask } = tokenize(text, v);
  const seqLen = input_ids.length;

  const feeds = {
    input_ids: new Tensor('int64', BigInt64Array.from(input_ids.map(BigInt)), [1, seqLen]),
    attention_mask: new Tensor('int64', BigInt64Array.from(attention_mask.map(BigInt)), [1, seqLen]),
  };

  const results = await sess.run(feeds);
  const logits = results['logits'].data as Float32Array;
  const arr = Array.from(logits);

  // weighted score: higher labels = more important
  const score = arr.reduce((sum, val, i) => sum + val * i, 0) / arr.reduce((sum, val) => sum + Math.abs(val), 0);
  console.log('urgency score:', score);
  return score > 0.3 ? 'important' : 'unimportant';
}