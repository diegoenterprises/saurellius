/**
 * SAURELLIUS COMMUNICATIONS HUB
 * Main messaging screen with inbox, channels, and recognition
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import messagingService, {
  Conversation,
  Channel,
  Recognition,
  Notification,
} from '../../services/messaging';

type TabType = 'inbox' | 'channels' | 'kudos' | 'notifications';

const MessagesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'inbox':
          const convResult = await messagingService.getConversations();
          setConversations(convResult.conversations || []);
          setUnreadCount(convResult.total_unread || 0);
          break;
        case 'channels':
          const chanResult = await messagingService.getChannels();
          setChannels(chanResult.channels || []);
          break;
        case 'kudos':
          const kudosResult = await messagingService.getRecognitionFeed(30);
          setRecognitions(kudosResult.recognitions || []);
          break;
        case 'notifications':
          const notifResult = await messagingService.getNotifications();
          setNotifications(notifResult.notifications || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching messaging data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Tab buttons
  const TabButton: React.FC<{
    tab: TabType;
    icon: string;
    label: string;
    badge?: number;
  }> = ({ tab, icon, label, badge }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={22}
        color={activeTab === tab ? '#1473FF' : '#666'}
      />
      <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
        {label}
      </Text>
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Conversation item
  const ConversationItem: React.FC<{ item: Conversation }> = ({ item }) => (
    <TouchableOpacity style={styles.listItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {`U${item.other_user_id}`.substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>User {item.other_user_id}</Text>
          <Text style={styles.listItemTime}>
            {item.last_activity ? new Date(item.last_activity).toLocaleDateString() : ''}
          </Text>
        </View>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {item.last_message?.content || 'No messages yet'}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Channel item
  const ChannelItem: React.FC<{ item: Channel }> = ({ item }) => (
    <TouchableOpacity style={styles.listItem}>
      <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
        <Ionicons name="chatbubbles" size={20} color="#fff" />
      </View>
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>#{item.name}</Text>
          <Text style={styles.memberCount}>{item.member_count} members</Text>
        </View>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {item.description || 'No description'}
        </Text>
      </View>
      {item.is_private && <Ionicons name="lock-closed" size={16} color="#666" />}
    </TouchableOpacity>
  );

  // Map icon names to Ionicons
  const getIconName = (iconName: string): string => {
    const iconMap: Record<string, string> = {
      'hands-clapping': 'thumbs-up',
      'star': 'star',
      'hand-heart': 'heart',
      'trophy': 'trophy',
      'handshake': 'people',
      'rocket': 'rocket',
      'gem': 'diamond',
      'lightbulb': 'bulb',
      'crown': 'ribbon',
      'target': 'flag',
    };
    return iconMap[iconName] || 'ribbon';
  };

  // Recognition item
  const RecognitionItem: React.FC<{ item: Recognition }> = ({ item }) => (
    <View style={styles.kudosCard}>
      <View style={styles.kudosHeader}>
        <View style={styles.kudosBadge}>
          <Ionicons 
            name={getIconName(item.badge.icon) as any} 
            size={24} 
            color="#1473FF" 
          />
        </View>
        <View style={styles.kudosInfo}>
          <Text style={styles.kudosBadgeName}>{item.badge.name}</Text>
          <Text style={styles.kudosPoints}>+{item.points} points</Text>
        </View>
      </View>
      <Text style={styles.kudosMessage}>{item.message}</Text>
      <View style={styles.kudosFooter}>
        <Text style={styles.kudosFrom}>
          From User {item.sender_id} to User {item.recipient_id}
        </Text>
        <Text style={styles.kudosTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  // Notification item
  const NotificationItem: React.FC<{ item: Notification }> = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.notificationUnread]}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={
            item.type === 'recognition'
              ? 'star'
              : item.type === 'message'
              ? 'mail'
              : item.type === 'schedule_swap'
              ? 'swap-horizontal'
              : 'notifications'
          }
          size={20}
          color={!item.read ? '#1473FF' : '#666'}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationText, !item.read && styles.notificationTextUnread]}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'inbox':
        return (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.conversation_id}
            renderItem={({ item }) => <ConversationItem item={item} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No conversations yet</Text>
                <Text style={styles.emptySubtext}>
                  Start a conversation with a coworker
                </Text>
              </View>
            }
          />
        );
      case 'channels':
        return (
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChannelItem item={item} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No channels</Text>
              </View>
            }
          />
        );
      case 'kudos':
        return (
          <FlatList
            data={recognitions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RecognitionItem item={item} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyText}>No recognition yet</Text>
                <Text style={styles.emptySubtext}>
                  Be the first to send kudos to a teammate!
                </Text>
              </View>
            }
          />
        );
      case 'notifications':
        return (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NotificationItem item={item} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1473FF', '#BE01FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Communications Hub</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowComposeModal(true)}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowKudosModal(true)}
          >
            <Ionicons name="star-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages, people, channels..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton tab="inbox" icon="mail" label="Inbox" badge={unreadCount} />
        <TabButton tab="channels" icon="chatbubbles" label="Channels" />
        <TabButton tab="kudos" icon="star" label="Kudos" />
        <TabButton
          tab="notifications"
          icon="notifications"
          label="Alerts"
          badge={notifications.filter((n) => !n.read).length}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1473FF',
  },
  tabLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#1473FF',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: '25%',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listItemTime: {
    fontSize: 12,
    color: '#999',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  memberCount: {
    fontSize: 12,
    color: '#999',
  },
  unreadBadge: {
    backgroundColor: '#1473FF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kudosCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kudosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kudosBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kudosEmoji: {
    fontSize: 24,
  },
  kudosInfo: {
    flex: 1,
  },
  kudosBadgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  kudosPoints: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  kudosMessage: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  kudosFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  kudosFrom: {
    fontSize: 13,
    color: '#666',
  },
  kudosTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationUnread: {
    backgroundColor: '#F0F7FF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationTextUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1473FF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default MessagesScreen;
