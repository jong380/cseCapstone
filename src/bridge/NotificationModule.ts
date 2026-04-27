import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { NotificationModule } = NativeModules;

if (Platform.OS === 'android' && !NotificationModule) {
  throw new Error('NotificationModule native module is not linked. Rebuild the Android app.');
}

export type IncomingNotification = {
  id: string;
  source: string;
  title: string;
  content: string;
  time: number;
};

export type NotificationAction = 'allow' | 'suppress';

// we mark the native (Android/Kotlin) module we just imported as an event emitter
export const notificationEmitter = new NativeEventEmitter(NotificationModule);

// passes on the function calls from 'NotificationFilter' to the backend
// -> This was just for type checking
export function resolveNotification(id: string, action: NotificationAction): void {
  NotificationModule.resolveNotification(id, action);
}

export function isNotificationListenerEnabled(): Promise<boolean> {
  return NotificationModule.isNotificationListenerEnabled();
}

export function openNotificationListenerSettings(): void {
  NotificationModule.openNotificationListenerSettings();
}
