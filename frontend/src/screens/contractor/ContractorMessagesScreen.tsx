/**
 * CONTRACTOR MESSAGE CENTER SCREEN
 * Communicate with clients and platform support
 * Threaded conversations, attachments, notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'contractor' | 'client' | 'support';
  sent_at: string;
  read: boolean;
  attachments?: { name: string; url: string; type: string }[];
}

interface Conversation {
  id: string;
  participant_name: string;
  participant_type: 'client' | 'support';
  participant_company?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  avatar_initial: string;
  status: 'active' | 'archived';
}

interface MessageStats {
  total_conversations: number;
  unread_messages: number;
  active_clients: number;
}

export default function ContractorMessagesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchConversations = useCallback(async () => {
    try {
      const [convRes, statsRes] = await Promise.all([
        api.get('/api/contractor/messages/conversations', { params: { type: filterType !== 'all' ? filterType : undefined } }),
        api.get('/api/contractor/messages/stats'),
      ]);
      setConversations(convRes.data.conversations || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await api.get(`/api/contractor/messages/conversations/${conversationId}/messages`);
      setMessages(response.data.messages || []);
      // Mark as read
      await api.post(`/api/contractor/messages/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const onRefresh = () => { setRefreshing(true); fetchConversations(); };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await api.post(`/api/contractor/messages/conversations/${selectedConversation.id}/messages`, { content: newMessage });
      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={[styles.conversationItem, item.unread_count > 0 && styles.conversationUnread]} onPress={() => setSelectedConversation(item)}>
      <View style={[styles.avatar, item.participant_type === 'support' && styles.supportAvatar]}>
        <Text style={styles.avatarText}>{item.avatar_initial}</Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>{item.participant_name}</Text>
          <Text style={styles.timeText}>{formatTime(item.last_message_at)}</Text>
        </View>
        {item.participant_company && <Text style={styles.companyName}>{item.participant_company}</Text>}
        <Text style={[styles.lastMessage, item.unread_count > 0 && styles.lastMessageUnread]} numberOfLines={1}>{item.last_message}</Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread_count}</Text></View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_type === 'contractor';
    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerMe]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.content}</Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{formatTime(item.sent_at)}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConversation(null)}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedConversation.participant_name}</Text>
            {selectedConversation.participant_company && <Text style={styles.chatHeaderCompany}>{selectedConversation.participant_company}</Text>}
          </View>
          <TouchableOpacity><Ionicons name="ellipsis-vertical" size={24} color="#FFF" /></TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          inverted
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}><Ionicons name="attach" size={24} color="#666" /></TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={!newMessage.trim()}>
              <Ionicons name="send" size={20} color={newMessage.trim() ? '#FFF' : '#666'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity><Ionicons name="create-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_conversations}</Text><Text style={styles.statLabel}>Conversations</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#1473FF' }]}>{stats.unread_messages}</Text><Text style={styles.statLabel}>Unread</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.active_clients}</Text><Text style={styles.statLabel}>Clients</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterBar}>
        {['all', 'client', 'support'].map(type => (
          <TouchableOpacity key={type} style={[styles.filterChip, filterType === type && styles.filterChipActive]} onPress={() => { setFilterType(type); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>{type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}
        ListEmptyComponent={
          <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={48} color="#666" /><Text style={styles.emptyText}>No conversations</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e', gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  listContent: { padding: 16 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  conversationUnread: { backgroundColor: '#1473FF10', borderColor: '#1473FF30' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  supportAvatar: { backgroundColor: '#10B981' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  conversationInfo: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  timeText: { fontSize: 12, color: '#666' },
  companyName: { fontSize: 12, color: '#666', marginTop: 2 },
  lastMessage: { fontSize: 13, color: '#a0a0a0', marginTop: 4 },
  lastMessageUnread: { color: '#FFF', fontWeight: '500' },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  chatHeaderInfo: { flex: 1, marginLeft: 12 },
  chatHeaderName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  chatHeaderCompany: { fontSize: 12, color: '#666', marginTop: 2 },
  messagesContainer: { padding: 16, flexGrow: 1 },
  messageContainer: { marginBottom: 12, alignItems: 'flex-start' },
  messageContainerMe: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  messageBubbleMe: { backgroundColor: '#1473FF', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#1a1a2e', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, color: '#666', marginBottom: 4 },
  messageText: { fontSize: 14, color: '#FFF', lineHeight: 20 },
  messageTextMe: { color: '#FFF' },
  messageTime: { fontSize: 10, color: '#666', marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  attachButton: { padding: 8 },
  messageInput: { flex: 1, backgroundColor: '#0f0f23', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#FFF', maxHeight: 100, marginHorizontal: 8 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#2a2a4e' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
