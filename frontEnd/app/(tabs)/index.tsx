import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { saveMessage } from '@/services/backendService';
import { sendChatMessage, type ChatMessage } from '@/services/chatService';

const INITIAL_GREETING: ChatMessage = {
  role: 'assistant',
  content:
    'What notifications do you want to prioritize? Family, work, or urgent alerts?',
};

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollRef = useRef<any>(null);

  // Sheet snaps to 50% or 90% of the screen height. Drag to switch between
  // them, or pan it down past 50% to dismiss.
  const snapPoints = useMemo(() => ['40%', '60%'], []);

  const openChat = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const closeChat = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Fire-and-forget: persist the user's message to the backend.
    // Doesn't block the UI or fail the chat if the backend is down.
    saveMessage({
      time: new Date().toISOString(),
      content: trimmed,
      source: 'chat',
      sender: 'user',
    });

    try {
      const reply = await sendChatMessage(nextMessages);
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);

      // Persist the assistant's reply too.
      saveMessage({
        time: new Date().toISOString(),
        content: reply,
        source: 'chat',
        sender: 'assistant',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setIsLoading(false);
      // Scroll to bottom after the new message renders
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 50);
    }
  }, [input, messages, isLoading]);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Nodi</Text>
        <Text style={styles.subtitle}>Your notifications</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Important</Text>
          <Text>Open to see</Text>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/explore')}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>Queued</Text>
          <Text>Open to see</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.openChatButton} onPress={openChat}>
        <Text style={styles.openChatButtonText}>Open Chat</Text>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // start hidden
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <View style={styles.sheetContent}>
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Chat with Nodi</Text>
            <TouchableOpacity onPress={closeChat}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetSubtitle}>
            Tell me what matters to you.
          </Text>

          <BottomSheetScrollView
            ref={scrollRef}
            style={styles.messagesArea}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={m.role === 'user' ? styles.userText : styles.assistantText}>
                  {m.content}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color="#666" />
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </BottomSheetScrollView>

          <View style={styles.inputRow}>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="Only notify me for work or family..."
              value={input}
              onChangeText={setInput}
              placeholderTextColor="#888"
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#555',
  },
  card: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  openChatButton: {
    backgroundColor: '#111',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  openChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    backgroundColor: '#d1d5db',
    width: 52,
    height: 6,
    borderRadius: 999,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 22,
    color: '#666',
  },
  sheetSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 4,
  },
  bubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '85%',
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#111',
    alignSelf: 'flex-end',
  },
  assistantText: {
    color: '#111',
    fontSize: 15,
  },
  userText: {
    color: '#fff',
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 30,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
