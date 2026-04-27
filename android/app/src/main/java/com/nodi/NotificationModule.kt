package com.nodi

// Android's way of navigating between screens or launching system pages
// -> we're gonna use this to open the settings screen
import android.content.Intent
// This gives us constants for system settings screens
import android.provider.Settings
// Lets us query notification-related state
// -> ex: whether our app has listener permission
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
// React Native class responsible for sending events from Kotlin to JavaScript/TypeScript
import com.facebook.react.modules.core.DeviceEventManagerModule




// The Java equivalent of declaring a constructor parameter and a class field BUT at the same time:
/*
-> So like this but much more concise:
  private ReactApplicationContext reactContext;
  public NotificationModule(ReactApplicationContext reactContext) {
      this.reactContext = reactContext;
  }
*/
class NotificationModule(private val reactContext: ReactApplicationContext) :
    // we're extending the React Native base class for native modules
    // -> it stores the reactContext for us
    // -> requires implementing getName() so React Native knows what to call the module
    ReactContextBaseJavaModule(reactContext) {

    // 'companion object' is Kotlin's version of static in Java
    // so it just means that anything inside of it belongs to the class itself
    // instead of just a singular instance/object

    // Analogy: Android creates an instance of 'NodiNotificationListenerService'
    // while React native creates an instance of 'NotificationModule',
    // -> This means they can't communicate with each other
    // -> So, static allows the module instance to write its reference in its class (blueprint)
    // -> The service instance can access that blueprint and use the stored reference to call the module instance
    // -> Important because the service instance will need to call the sendEvent() function
    companion object {
        private var instance: NotificationModule? = null

        // This function will push a notification to the frontend
        fun sendEvent(payload: WritableMap) {
            // check if the instance isn't null
            instance?.reactContext
                // gets the React Native event emitter that can talk to JavaScript/TypeScript
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                // triggers the emit function which fires the event
                // this will be sent to the frontend which catches it
                ?.emit("onNotificationReceived", payload)
        }
    }

    // when an object is constructed, set the static 'instance' to the newly created object
    init {
        instance = this
    }

    // This is the name that our frontend will see this module as
    override fun getName() = "NotificationModule"

    // This exposes the function to the frontend
    @ReactMethod
    // This function forwards the notification ID and the LLM's decision to our service to be handled
    fun resolveNotification(notificationId: String, action: String) {
        // No need to import since they are in the same package
        NodiNotificationListenerService.resolveNotification(notificationId, action)
    }

    // This exposes the function to the frontend
    @ReactMethod
    // This function checks if Nodi's package name is in the
    // list of apps that have been granted notification listener access
    fun isNotificationListenerEnabled(promise: Promise) {
        val enabled = NotificationManagerCompat
            .getEnabledListenerPackages(reactContext)
            .contains(reactContext.packageName)
        promise.resolve(enabled)
    }

    // This exposes the function to the frontend
    @ReactMethod
    // this function opens the system notification listener settings page
    fun openNotificationListenerSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    // Required by React Native's NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {}
    @ReactMethod
    fun removeListeners(count: Int) {}
}
