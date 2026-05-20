import { EmitterSubscription } from 'react-native';
import {
notificationEmitter,
resolveNotification,
IncomingNotification,
} from '../bridge/NotificationModule';
import { classifyNotification } from './ClassificationService';

let subscription: EmitterSubscription | null = null;
let focusModeEnabled = false;

export function setFilterFocusMode(enabled: boolean): void {
  focusModeEnabled = enabled;
}

export type FilterEvent =
| { type: 'allowed'; notification: IncomingNotification }
| { type: 'suppressed'; notification: IncomingNotification }
| { type: 'error'; notification: IncomingNotification; error: Error };

type FilterEventHandler = (event: FilterEvent) => void;

export function startNotificationFilter(onEvent?: FilterEventHandler): void {
  if (subscription) {
    return;
  }

  // Listens to any 'onNotificationReceived' events emitted from the backend
  // -> this event triggers every time a notification pops up
  subscription = notificationEmitter.addListener(
    'onNotificationReceived',
    async (notification: IncomingNotification) => {
        console.log('notification received:', notification);
      try {
        // mock LLM logic, classifies important or unimportant
        const priority = await classifyNotification(
          notification.source,
          notification.title,
          notification.content,
        );
console.log('classified as:', priority);  // add this
        // sends the notification ID and LLM decision to backend
        // suppression only applies when focus mode is active
        if (priority === 'important' || !focusModeEnabled) {
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