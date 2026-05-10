import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { listMessages, type SavedMessage } from '@/services/backendService';

export default function SuppressedScreen() {
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await listMessages();
      // Hide chat turns — only show real notification rows.
      const suppressed = rows.filter((m) => m.source !== 'chat');
      setMessages(suppressed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Queued</Text>
        <Text style={styles.subtitle}>Notifications Nodi filtered out for you.</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nothing queued yet</Text>
          <Text style={styles.emptyBody}>
            When Nodi filters a notification, it&apos;ll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#111"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSource}>{item.source}</Text>
                <Text style={styles.cardTime}>{formatTime(item.time)}</Text>
              </View>
              <Text style={styles.cardSender}>{item.sender}</Text>
              <Text style={styles.cardContent}>{item.content}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 70,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#111',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },
  emptyBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#111',
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardSource: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTime: {
    fontSize: 12,
    color: '#888',
  },
  cardSender: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },
  cardContent: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
});
