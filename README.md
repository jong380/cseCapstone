# Nodi

An Android app that intercepts notifications during focus mode, classifies them using an LLM, and suppresses unimportant ones.

Iryna Kovalenko, Keosha Chhajed, Ian Limasi, Jayden Ong

## Project structure

```
android/app/src/main/java/com/nodi/
  NodiNotificationListenerService.kt  -- listens to all Android notifications
  NotificationModule.kt               -- bridge between Kotlin and JavaScript
  NotificationPackage.kt              -- registers the module with React Native
  Message.kt                          -- database table schema
  MessageDao.kt                       -- queries for database operations
  NodiDatabase.kt                     -- database object

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

Afterwards, Create a `.env` file in the project root using this template: ```GROQ_API_KEY=your_api_key_here```

Also, for proper notification fetching, add this line as well in `.env`:BACKEND_URL=http://localhost:3000/

## Running the Project

Open 3 terminals from the project root:

| Terminal | Command | Description |
|----------|---------|-------------|
| 1 | `npm start` | Starts Metro bundler |
| 2 | `cd server && npm start` | Starts Express backend |
| 3 (once per session) | `adb reverse tcp:3000 tcp:3000` | Forwards backend port to physical device |

> **Note:** Terminal 3 is only needed when testing on a physical Android device. Re-run it each time you reconnect your device via USB.

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
