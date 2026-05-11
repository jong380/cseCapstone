import { EmitterSubscription } from 'react-native';
import {
  notificationEmitter,
  resolveNotification,
  IncomingNotification,
} from '../bridge/NotificationModule';
import { classifyNotification } from './ClassificationService';

import { BACKEND_URL } from '@env';
let subscription: EmitterSubscription | null = null;

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
      try {
        // mock LLM logic, classifies important or unimportant
        const priority = await classifyNotification(
          notification.source,
          notification.title,
          notification.content,
        );

        // sends the notification ID and LLM decision to backend
        if (priority === 'important') {
          resolveNotification(notification.id, 'allow');
          onEvent?.({ type: 'allowed', notification });
        } else {
          resolveNotification(notification.id, 'suppress');
          // Fetch POST request
          fetch(`${BACKEND_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              time: new Date(notification.time).toISOString(),
              content: notification.content,
              source: notification.source,
              sender: notification.title,
              status: 'suppressed',
            }),
          }).catch(err => console.error('Backend post failed:', err));
          onEvent?.({ type: 'suppressed', notification });
        }
      } catch (err) {
        onEvent?.({ type: 'error', notification, error: err as Error });
      }
    },
    );
}

export function stopNotificationFilter(): void {
  subscription?.remove();
  subscription = null;
}

