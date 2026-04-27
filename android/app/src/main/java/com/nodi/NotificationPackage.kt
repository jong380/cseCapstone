/*
THE IDEA:
NotificationPackage: Tells React Native "these modules exist"
NotificationModule: The actual bridge (exposes functions to JS and sends events to JS)
NodiNotificationListenerService: Does the real Android work (listens to notifications, cancels them)
 */

package com.nodi

// Default imports from React Native
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

// 'class X : Y' is Kotlin syntax for 'class X implements Y' in Java
// So, this class is implementing the ReactPackage interface
// -> React Native looks at every registered reactpackage at start up
// -> Then calls both of these functions
class NotificationPackage : ReactPackage {

    // This is what React Native will call, it asks what native modules
    // (just think Kotlin functions) are there

    // NOTE: reactContext is an object React Native gives you that represents the running app
    // -> it lets native code access everything about the currently running React Native app:
    // send events to JS, start Android screens, get the app's package name, etc
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        // we return a list containing our only module right now
        listOf(NotificationModule(reactContext))

    // React Native will also ask for any custom UI components we made in Kotlin but we have none
    // so we return an empty list
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
