import { classifyNotification } from '../ClassificationService';

const testCases = [
  // Stage 1: Marketing/Promo
  { source: 'com.ubereats.android', title: 'CRITICAL HUNGER ALERT', content: 'Order now for 50% off tacos!', expected: 'unimportant' },
  { source: 'com.doordash.consumer', title: 'Free delivery today!', content: 'Use code SAVE20 at checkout', expected: 'unimportant' },
  { source: 'com.tiktok.android', title: 'New video', content: 'Someone you follow posted', expected: 'unimportant' },
  { source: 'com.snapchat.android', title: 'Snap from Alex', content: 'Alex sent you a snap', expected: 'unimportant' },
  { source: 'com.amazon.mShop', title: 'Flash sale ends tonight', content: 'Limited time: 30% off electronics', expected: 'unimportant' },

  // Stage 2: Critical Apps
  { source: 'com.pagerduty.android', title: 'ALERT', content: 'Production server is down', expected: 'important' },
  { source: 'com.scoutalarm', title: 'Motion Detected', content: 'Front door camera triggered', expected: 'important' },

  // Stage 3: Emergency Keywords
  { source: 'com.google.android.apps.messaging', title: 'Mom', content: 'I am at the hospital right now, please call me.', expected: 'important' },
  { source: 'com.whatsapp', title: 'Dad', content: 'Are you okay? Please respond', expected: 'important' },
  { source: 'com.google.android.gm', title: 'Security Alert', content: 'Suspicious login detected on your account', expected: 'important' },
  { source: 'com.google.android.gm', title: 'Action Required', content: 'Password reset requested for your account', expected: 'important' },

  // Stage 4: Qwen
  { source: 'com.slack', title: 'John', content: 'Can you join the standup in 5 mins?', expected: 'important' },
  { source: 'com.slack', title: 'Random channel', content: 'Anyone watch the game last night?', expected: 'unimportant' },
  { source: 'com.delta.mobile', title: 'Gate Change', content: 'Your flight gate changed to B12. Boarding in 10 minutes.', expected: 'important' },
  { source: 'com.google.android.gm', title: 'Meeting in 15 min', content: 'Reminder: Team sync starts at 3pm', expected: 'important' },
  { source: 'com.google.android.gm', title: 'Newsletter', content: 'Top 10 productivity tips this week', expected: 'unimportant' },
  { source: 'com.instagram.android', title: 'New like', content: 'Someone liked your photo', expected: 'unimportant' },
  { source: 'com.venmo', title: 'Payment received', content: 'Alex sent you $50', expected: 'important' },
  { source: 'com.venmo', title: 'Reminder', content: 'You still owe $12 for pizza', expected: 'unimportant' },

  // Edge cases
  { source: 'com.grubhub.android', title: 'URGENT: Order expiring!', content: 'Complete your order before it expires', expected: 'unimportant' },
  { source: 'com.google.android.apps.messaging', title: 'Alex', content: 'Car broke down on the highway, call me', expected: 'important' },
  { source: 'com.google.android.gm', title: 'Special offer from IT', content: 'Free VPN license for all employees this week', expected: 'unimportant' },
];

describe('ClassificationService', () => {
  test.each(testCases)('$source | $title → $expected', async ({ source, title, content, expected }) => {
    const result = await classifyNotification(source, title, content);
    expect(result).toBe(expected);
  });
});