# Nodi

An Android app that intercepts notifications during focus mode, classifies them using uLM, and suppresses unimportant ones.

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
  screens/
    HomeScreen.tsx                    -- main UI screen
    QueuedScreen.tsx                  -- UI screen for queued notifications
  services/
    backendService.ts                -- backend POST requests
    chatService.ts                   -- chat with Groq's LLM API (May be replaced by Qwen we will see)


App.tsx                               -- UI entry point
```

## Local AI Model Installation (Qwen GGUF)

Nodi processes notification contexts locally using an optimized, on-device large language model (Qwen3 0.6B). 
You must install Qwen3 onto your device before using Nodi.

### 1. Download the Base Weights
Download the Qwen3 0.6B Chat parameter GGUF file.
* **Model Target File:** `qwen.gguf` (Recommended size: ~380 MB)

### 2. Push Asset to Android Storage Filepath
Ensure your target device/emulator is plugged in with **USB Debugging Enabled**, then copy the downloaded model directly into the Nodi local application directory using (`adb`):

```
# Verify your device is detected:
adb devices

# Install Qwen onto device:
adb push /path/to/your/downloaded/qwen.gguf /data/user/0/com.nodi/files/qwen.gguf
```
## Testing

Grant notification access to the app:

```
adb shell am start -a android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS
```

Send a test notification:

```bash
adb shell cmd notification post -S bigtext -t "TestTitle" "tag" "Test notification body"
```

The Nodi log screen will show whether the notification was allowed or suppressed.
