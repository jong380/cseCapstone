import { EmitterSubscription } from 'react-native';
import {
notificationEmitter,
resolveNotification,
IncomingNotification,
} from '../bridge/NotificationModule';
import { classifyNotification, initializeClassifier } from './ClassificationService';

let subscription: EmitterSubscription | null = null;

// These are the types of notification categories we put incoming notifications into, to see if they are displayed or not.
export type FilterEvent =
| { type: 'allowed'; notification: IncomingNotification }
| { type: 'suppressed'; notification: IncomingNotification }
| { type: 'error'; notification: IncomingNotification; error: Error };

type FilterEventHandler = (event: FilterEvent) => void;

export function startNotificationFilter(onEvent?: FilterEventHandler): void {
  if (subscription) {
    return;
  }

  // Upon startup of the app, we turn on Llama to being classifying as soon as possible.
  initializeClassifier()
    .then(() => console.log("Filter startup: Llama initialization triggered."))
    .catch(err => console.error("Filter startup: Llama initialization failed:", err));

  // Everything else stays the same, where we grab notifications from Android's NotificationListenerService.
  subscription = notificationEmitter.addListener(
    'onNotificationReceived',
    async (notification: IncomingNotification) => {
      console.log('notification received:', notification);
      // A buffer is added here to let the UI settle upon first startup to prevent any freezing/latency issues.
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        const priority = await classifyNotification(
          notification.source,
          notification.title,
          notification.content,
        );
        console.log('classified as:', priority);
        // We only post the important notifications to Android's status bar if it is classified as important. Otherwise, they get suppressed and stored in the database.
        if (priority === 'important') {
          resolveNotification(notification.id, 'allow');
          onEvent?.({ type: 'allowed', notification });
        } else {
          resolveNotification(notification.id, 'suppress');
          onEvent?.({ type: 'suppressed', notification });
        }
      } catch (err) {
        onEvent?.({ type: 'error', notification, error: err as Error });
        console.log('classification error:', err);
      }
    }
  );
}

export function stopNotificationFilter(): void {
  subscription?.remove();
  subscription = null;
}