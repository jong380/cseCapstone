import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {startNotificationFilter, stopNotificationFilter, FilterEvent} from './src/logic/NotificationFilter';

type LogEntry = {
  id: string;
  label: string;
  color: string;
};

function App(): React.JSX.Element {
  const [log, setLog] = useState<LogEntry[]>([]);

  // we're passing a callback function to 'startNotificationFilter'
  // -> the callback function will add the notification to the 'log' useState
  // -> every log in the 'log' state will be displayed
  // NOTE: 'startNotificationFilter' runs continuously until the app is closed
  useEffect(() => {
    startNotificationFilter((event: FilterEvent) => {
      const entry: LogEntry = {
        id: `${event.notification.id}-${Date.now()}`,
        label:
          event.type === 'allowed'
            ? `+ ALLOWED -> ${event.notification.title}: ${event.notification.content}`
            : event.type === 'suppressed'
            ? `- SUPPRESSED -> ${event.notification.title}: ${event.notification.content}`
            : `! ERROR -> ${event.notification.title}: ${event.error.message}`,
        color:
          event.type === 'allowed'
            ? '#2e7d32'
            : event.type === 'suppressed'
            ? '#c62828'
            : '#e65100',
      };
      setLog(prev => [entry, ...prev]);
    });

    return () => stopNotificationFilter();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Nodi</Text>
        <Text style={styles.subText}>Filter is active</Text>
      </View>
      <ScrollView style={styles.scroll}>
        {log.length === 0 ? (
          <Text style={styles.empty}>No notifications intercepted yet.</Text>
        ) : (
          log.map(entry => (
            <Text key={entry.id} style={[styles.entry, {color: entry.color}]}>
              {entry.label}
            </Text>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#1a1a1a'},
  header: {padding: 24, borderBottomWidth: 1, borderBottomColor: '#333'},
  headerText: {fontSize: 20, fontWeight: '700', color: '#fff'},
  subText: {fontSize: 13, color: '#4caf50', marginTop: 4},
  scroll: {flex: 1, padding: 16},
  empty: {color: '#888', marginTop: 16, textAlign: 'center'},
  entry: {fontSize: 14, marginBottom: 12, lineHeight: 20},
});

export default App;
