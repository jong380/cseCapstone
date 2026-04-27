export type Priority = 'important' | 'unimportant';

export async function classifyNotification(
  _source: string,
  _title: string,
  _content: string,
): Promise<Priority> {
  // Randomly allow/suppress so both paths can be tested
  return Math.random() > 0.5 ? 'important' : 'unimportant';
}
