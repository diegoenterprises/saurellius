/**
 * EMPLOYEE COMPANY EVENTS SCREEN
 * View and RSVP for company events
 * Meetings, celebrations, team building
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface CompanyEvent {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'celebration' | 'training' | 'team_building' | 'town_hall';
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_virtual: boolean;
  virtual_link?: string;
  organizer: string;
  attendees_count: number;
  max_attendees?: number;
  rsvp_status: 'attending' | 'not_attending' | 'maybe' | 'pending';
  is_mandatory: boolean;
}

interface EventStats {
  upcoming_events: number;
  attending: number;
  pending_rsvp: number;
  this_month: number;
}

const EVENT_TYPES = [
  { id: 'meeting', name: 'Meeting', icon: 'people', color: '#3B82F6' },
  { id: 'celebration', name: 'Celebration', icon: 'sparkles', color: '#F59E0B' },
  { id: 'training', name: 'Training', icon: 'school', color: '#10B981' },
  { id: 'team_building', name: 'Team Building', icon: 'heart', color: '#EC4899' },
  { id: 'town_hall', name: 'Town Hall', icon: 'megaphone', color: '#8B5CF6' },
];

export default function CompanyEventsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        api.get('/api/employee/company-events', { params: { filter: activeTab } }),
        api.get('/api/employee/company-events/stats'),
      ]);
      setEvents(eventsRes.data.events || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const getEventTypeInfo = (type: string) => EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];

  const getRsvpColor = (status: string) => {
    switch (status) {
      case 'attending': return '#10B981';
      case 'not_attending': return '#EF4444';
      case 'maybe': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleRsvp = async (event: CompanyEvent, status: string) => {
    try {
      await api.post(`/api/employee/company-events/${event.id}/rsvp`, { status });
      fetchData();
      Alert.alert('Success', `RSVP updated to ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update RSVP');
    }
  };

  const renderEventCard = (event: CompanyEvent) => {
    const typeInfo = getEventTypeInfo(event.type);
    const isToday = new Date(event.date).toDateString() === new Date().toDateString();

    return (
      <View key={event.id} style={[styles.eventCard, isToday && styles.todayCard]}>
        {isToday && <View style={styles.todayBadge}><Text style={styles.todayText}>Today</Text></View>}
        {event.is_mandatory && <View style={styles.mandatoryBadge}><Ionicons name="alert-circle" size={12} color="#EF4444" /><Text style={styles.mandatoryText}>Required</Text></View>}
        
        <View style={styles.eventHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.detailText}>{formatTime(event.start_time)} - {formatTime(event.end_time)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name={event.is_virtual ? 'videocam' : 'location'} size={14} color={event.is_virtual ? '#3B82F6' : '#666'} />
            <Text style={[styles.detailText, event.is_virtual && { color: '#3B82F6' }]}>{event.is_virtual ? 'Virtual' : event.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color="#666" />
            <Text style={styles.detailText}>By {event.organizer}</Text>
          </View>
        </View>

        <View style={styles.attendeesRow}>
          <Ionicons name="people" size={16} color="#a0a0a0" />
          <Text style={styles.attendeesText}>{event.attendees_count} attending{event.max_attendees ? ` / ${event.max_attendees} max` : ''}</Text>
        </View>

        <View style={styles.rsvpSection}>
          <Text style={styles.rsvpLabel}>Your RSVP:</Text>
          <View style={styles.rsvpButtons}>
            {['attending', 'maybe', 'not_attending'].map(status => (
              <TouchableOpacity key={status} style={[styles.rsvpButton, event.rsvp_status === status && { backgroundColor: getRsvpColor(status) }]} onPress={() => handleRsvp(event, status)}>
                <Ionicons name={status === 'attending' ? 'checkmark' : status === 'maybe' ? 'help' : 'close'} size={16} color={event.rsvp_status === status ? '#FFF' : '#666'} />
                <Text style={[styles.rsvpButtonText, event.rsvp_status === status && { color: '#FFF' }]}>{status === 'not_attending' ? 'No' : status.charAt(0).toUpperCase() + status.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {event.is_virtual && event.virtual_link && event.rsvp_status === 'attending' && (
          <TouchableOpacity style={styles.joinButton}>
            <Ionicons name="videocam" size={18} color="#FFF" />
            <Text style={styles.joinText}>Join Meeting</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Company Events</Text>
          <TouchableOpacity><Ionicons name="calendar-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.upcoming_events}</Text><Text style={styles.statLabel}>Upcoming</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.attending}</Text><Text style={styles.statLabel}>Attending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_rsvp}</Text><Text style={styles.statLabel}>Pending</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]} onPress={() => { setActiveTab('upcoming'); setLoading(true); }}>
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'past' && styles.tabActive]} onPress={() => { setActiveTab('past'); setLoading(true); }}>
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {events.length > 0 ? events.map(renderEventCard) : (
            <View style={styles.emptyState}><Ionicons name="calendar-outline" size={48} color="#666" /><Text style={styles.emptyText}>No events</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  eventCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  todayCard: { borderColor: '#1473FF' },
  todayBadge: { position: 'absolute', top: -8, right: 16, backgroundColor: '#1473FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  todayText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  mandatoryBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 10, gap: 4 },
  mandatoryText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  eventDesc: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },
  eventDetails: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#a0a0a0' },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  attendeesText: { fontSize: 13, color: '#a0a0a0' },
  rsvpSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  rsvpLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  rsvpButtons: { flexDirection: 'row', gap: 8 },
  rsvpButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 4 },
  rsvpButtonText: { fontSize: 13, fontWeight: '500', color: '#666' },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 10, marginTop: 12, gap: 6 },
  joinText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
