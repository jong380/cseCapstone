# Nodi

An Android app that intercepts notifications during focus mode, classifies them using an LLM, and suppresses unimportant ones.

## Project structure

```
android/app/src/main/java/com/nodi/
  NodiNotificationListenerService.kt  -- listens to all Android notifications
  NotificationModule.kt               -- bridge between Kotlin and JavaScript
  NotificationPackage.kt              -- registers the module with React Native

src/
  bridge/
    NotificationModule.ts             -- typed TypeScript wrapper over the bridge
  logic/
    NotificationFilter.ts             -- orchestrates notifications through the LLM
    ClassificationService.ts          -- LLM classification (swap this out for real LLM)

App.tsx                               -- UI entry point
```

## Project Setup
This project requires an API KEY to classify notifications. Get your free API Key here: https://console.groq.com
Afterwards, Create a `.env` file in the project root using this template: GROQ_API_KEY=your_api_key_here

## Testing

Grant notification access to the app:

```bash
adb shell am start -a android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS
```

Send a test notification:

```bash
adb shell cmd notification post -S bigtext -t "TestTitle" "tag" "Test notification body"
```

The Nodi log screen will show whether the notification was allowed or suppressed.

# Nodi - AI Notification Filtering App
CSE 481 L Capstone

Iryna Kovalenko, Keosha Chhajed, Ian Limasi, Jayden Ong
