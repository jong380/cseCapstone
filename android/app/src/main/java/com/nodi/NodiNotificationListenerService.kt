package com.nodi

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.WritableNativeMap

// This class extends NotificationListenerService, to be Nodi-specific
// This is what registers the class with Android as a real notification listener
class NodiNotificationListenerService : NotificationListenerService() {

    // Same idea here, allows the module instance to use the stored reference of the
    // service instance to call the resolveNotification() function
    companion object {
        private var instance: NodiNotificationListenerService? = null

        // Called from frontend (via NotificationModule) with the LLM's decision
        fun resolveNotification(key: String, action: String) {
            if (action == "suppress") {
                instance?.cancelNotification(key)
            }
            // "allow" = do nothing, notification is already posted
        }
    }

    // same with instance but since services made by Android can be killed and restarted
    // while the app is still running, we create and destroy explicitly
    // -> if we just used init here, if a service gets killed, its reference is never erased
    override fun onCreate() {
        super.onCreate()
        instance = this
    }
    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /*
    sbn example structure:
      StatusBarNotification {
          .key         -> "com.whatsapp|0|123"  // unique ID for this notification
          .packageName -> "com.whatsapp"         // which app sent it
          .postTime    -> 1714123456000          // timestamp in milliseconds
          .notification -> Notification {
              .extras -> Bundle {               // like a HashMap
                  EXTRA_TITLE -> "John"
                  EXTRA_TEXT  -> "hey are you free?"
                  // ... other stuff
              }
          }
        }
     */

    // Android calls this every time a notification is posted
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        // We don't want to process notifications from our own app
        // -> this could lead to an infinite loop
        // packageName is also a property of the 'NotificationListenerService' class we extended
        if (sbn.packageName == packageName) {
            return
        }

        val extras = sbn.notification.extras
        // We imported the Notification object btw
        // It allows us to use constants that simplify the actual key names
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val content = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        // This just makes a HashMap that the frontend can later turn into a JavaScript/TypeScript object
        val payload = WritableNativeMap().apply {
            putString("id", sbn.key)
            putString("source", sbn.packageName)
            putString("title", title)
            putString("content", content)
            putDouble("time", sbn.postTime.toDouble())
        }

        // No need to import since they are in the same package
        NotificationModule.sendEvent(payload)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {}
}
