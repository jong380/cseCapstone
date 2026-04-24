import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Nodi</Text>
        <Text style={styles.subtitle}>Your notifications</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Important</Text>
          <Text>Open to see</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Queued</Text>
          <Text>Open to see</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.openChatButton}
        onPress={() => setChatVisible(true)}
      >
        <Text style={styles.openChatButtonText}>Open Chat</Text>
      </TouchableOpacity>

      <Modal
        visible={chatVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.chatSheet,
              expanded ? styles.chatSheetExpanded : styles.chatSheetHalf,
            ]}
          >
            <TouchableOpacity
              style={styles.handleArea}
              onPress={() => setExpanded(!expanded)}
              onLongPress={() => setChatVisible(false)} 
            >
              <View style={styles.handle} />
            </TouchableOpacity>

            <View style={styles.headerRow}>
              <Text style={styles.sheetTitle}>Chat with Nodi</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Tell me what matters to you.
            </Text>

            <View style={styles.messageBubble}>
              <Text>
                What notifications do you want to prioritize? Family, work, or urgent alerts?
              </Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Only notify me for work or family..."
                value={message}
                onChangeText={setMessage}
                placeholderTextColor="#888"
              />

              <TouchableOpacity style={styles.sendButton}>
                <Text style={styles.sendButtonText}>↑</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.resizeButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.resizeButtonText}>
                {expanded ? 'Make Smaller' : 'Expand Chat'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  chatSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  chatSheetHalf: {
    height: 330,
  },
  chatSheetExpanded: {
    height: 540,
  },
  handleArea: {
    alignItems: 'center',
    marginBottom: 10,
  },
  handle: {
    width: 52,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
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
    marginBottom: 16,
  },
  messageBubble: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
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
  marginBottom: 12,
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

  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  resizeButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
  },
  resizeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
});