import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startNotificationFilter, stopNotificationFilter } from './src/logic/NotificationFilter';
import HomeScreen from './src/screens/HomeScreen';
import QueuedScreen from './src/screens/QueuedScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  // Start the notification filter pipeline on mount, stop on unmount.
  // This runs the LLM classification + backend POST behind the scenes.
  useEffect(() => {
    startNotificationFilter();
    return () => stopNotificationFilter();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Queued" component={QueuedScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;