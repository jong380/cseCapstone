export type Priority = 'important' | 'unimportant';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { BertTokenizer } from 'bert-tokenizer';

let session: InferenceSession | null = null;
const tokenizer = new BertTokenizer();

async function loadModel(): Promise<InferenceSession> {
  if (!session) {
    session = await InferenceSession.create('model.onnx');
  }
  return session;
}

export async function classifyNotification(
  _source: string,
  _title: string,
  _content: string,
): Promise<Priority> {
  const sess = await loadModel();

  const text = `${_source} ${_title} ${_content}`;
  const encoded = tokenizer.tokenize(text); // true = add special tokens [CLS] and [SEP]
  const input_ids = encoded;
  const attention_mask = new Array(input_ids.length).fill(1);


  const seqLen = input_ids.length;
  const feeds = {
    input_ids: new Tensor('int64', BigInt64Array.from(input_ids.map(BigInt)), [1, seqLen]),
    attention_mask: new Tensor('int64', BigInt64Array.from(attention_mask.map(BigInt)), [1, seqLen]),
  };

  const results = await sess.run(feeds);
  const logits = results['logits'].data as Float32Array;

  // argmax — find which label got highest score
const predicted = logits.indexOf(Math.max(...Array.from(logits)));

// predicted is 0-4 (representing stars 1-5)
return predicted >= 3 ? 'important' : 'unimportant';
}