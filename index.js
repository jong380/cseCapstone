/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee from '@notifee/react-native';

// We use Notifee, a JS library that allows for the app to run in the background until turned off.
notifee.registerForegroundService((notification) => {
  return new Promise(() => {

  });
});

AppRegistry.registerComponent(appName, () => App);
