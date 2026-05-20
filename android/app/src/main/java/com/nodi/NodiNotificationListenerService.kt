package com.nodi

import android.app.Notification

import androidx.core.app.NotificationCompat
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.facebook.react.bridge.WritableNativeMap
import android.content.pm.PackageManager

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import com.nodi.Message
import com.nodi.NodiDatabase

// This class extends NotificationListenerService, to be Nodi-specific
// This is what registers the class with Android as a real notification listener
class NodiNotificationListenerService : NotificationListenerService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)
    // Same idea here, allows the module instance to use the stored reference of the
    // service instance to call the resolveNotification() function
    companion object {
        private var instance: NodiNotificationListenerService? = null
        var focusModeActive = false

        // Lets NotificationModule look up a pending notification by key before passing it to resolveNotification
        fun getPending(key: String): StoredNotification? = instance?.pending?.get(key)

        // Called from frontend (via NotificationModule) with the LLM's decision
        fun resolveNotification(key: String, action: String, originalSbn: StoredNotification?) {
            if (action == "suppress") {
                instance?.cancelNotification(key)
                instance?.serviceScope?.launch {
                    instance?.let {
                        val msg = Message(
                            notifKey = key,
                            time = originalSbn?.time ?: "",
                            content = originalSbn?.content ?: "",
                            source = originalSbn?.appName ?: "",
                            sender = originalSbn?.title ?: "",
                            status = "suppressed"
                        )
                        NodiDatabase.getInstance(it.applicationContext)
                            .messageDao().insert(msg)
                    }
                }
            }
            else if (action == "allow" && focusModeActive && originalSbn != null) {
                // In focus mode, DND has already suppressed the original notification
                // so we cancel it and re-post on a channel that bypasses DND
                instance?.cancelNotification(key)
                instance?.repostNotification(originalSbn)
            }
            // "allow" with no focusModeActive = not in focus mode, notification is already posted
            instance?.pending?.remove(key)
        }
    }

    // Holds enough data to re-post a notification after DND suppresses it
    data class StoredNotification(
        val appName: String,
        val title: String,
        val content: String,
        val time: String,
    )

    // Tracks pending notifications by key while waiting for the LLM decision
    private val pending = mutableMapOf<String, StoredNotification>()

    private val REPOST_CHANNEL_ID = "nodi_important"
    private var channelCreated = false


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

        serviceScope.cancel()
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

        // No need to classify or store anything if focus mode is off
        if (!focusModeActive) {
            return
        }

        val extras = sbn.notification.extras
        // We imported the Notification object btw
        // It allows us to use constants that simplify the actual key names
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val content = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        // Fetch Application name instead of "com.android.etc etc"
        val pm = applicationContext.packageManager
        val appName = try {
            val appInfo = pm.getApplicationInfo(sbn.packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            sbn.packageName // Fallback to package name if it fails
        }

        // Store the notification so we can re-post it if the LLM marks it important (used in focus mode)
        pending[sbn.key] = StoredNotification(appName, title, content, sbn.postTime.toString())

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

    // Re-posts an important notification on a DND-bypassing channel
    // The title shows the original app name so the user knows where it came from
    fun repostNotification(original: StoredNotification) {
        ensureChannelExists()
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val notification = NotificationCompat.Builder(this, REPOST_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(original.appName)
            .setContentText("[Nodi] ${original.content}")
            .setStyle(NotificationCompat.BigTextStyle().bigText("[Nodi] ${original.content}"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    // Creates the notification channel that bypasses DND, only needs to run once
    private fun ensureChannelExists() {
        if (channelCreated) {
            return
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            REPOST_CHANNEL_ID,
            "Nodi Important Notifications",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            setBypassDnd(true)
        }
        manager.createNotificationChannel(channel)
        channelCreated = true
    }
}
