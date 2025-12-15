/**
 * CONTRACTOR CLIENT DIRECTORY SCREEN
 * Manage client relationships and contacts
 * View client details, history, and communication
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
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../../components/common/BackButton';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface ClientContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  is_primary: boolean;
}

interface Client {
  id: string;
  name: string;
  logo_url?: string;
  industry?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contacts: ClientContact[];
  status: 'active' | 'inactive' | 'prospect';
  relationship_start?: string;
  total_revenue: number;
  active_projects: number;
  completed_projects: number;
  last_interaction?: string;
  notes?: string;
  tags: string[];
}

interface ClientStats {
  total_clients: number;
  active_clients: number;
  total_revenue: number;
  avg_project_value: number;
}

export default function ContractorClientsScreen() {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const [clientsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/clients', {
          params: { 
            search: searchQuery,
            status: filterStatus !== 'all' ? filterStatus : undefined,
          }
        }),
        api.get('/api/contractor/clients/stats'),
      ]);
      
      setClients(clientsRes.data.clients || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClients();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'prospect': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsite = (url: string) => {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    Linking.openURL(url);
  };

  const handleCreateInvoice = (client: Client) => {
    navigation.navigate('ContractorInvoices', { clientId: client.id });
  };

  const renderClientCard = ({ item }: { item: Client }) => {
    const isExpanded = selectedClient?.id === item.id;
    const primaryContact = item.contacts.find(c => c.is_primary) || item.contacts[0];

    return (
      <View style={styles.clientCard}>
        <TouchableOpacity 
          style={styles.clientHeader}
          onPress={() => setSelectedClient(isExpanded ? null : item)}
        >
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitial}>{item.name[0]}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.name}</Text>
            {item.industry && (
              <Text style={styles.clientIndustry}>{item.industry}</Text>
            )}
            <View style={styles.clientMeta}>
              <Text style={styles.clientRevenue}>{formatCurrency(item.total_revenue)}</Text>
              <Text style={styles.clientMetaDot}>•</Text>
              <Text style={styles.clientProjects}>{item.active_projects} active</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </TouchableOpacity>

        {primaryContact && (
          <View style={styles.primaryContact}>
            <Ionicons name="person" size={14} color="#666" />
            <Text style={styles.primaryContactName}>{primaryContact.name}</Text>
            <Text style={styles.primaryContactRole}>({primaryContact.role})</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.clientExpanded}>
            <View style={styles.quickActions}>
              {primaryContact?.phone && (
                <TouchableOpacity 
                  style={styles.quickAction}
                  onPress={() => handleCall(primaryContact.phone!)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="call" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.quickActionText}>Call</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => primaryContact && handleEmail(primaryContact.email)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="mail" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionText}>Email</Text>
              </TouchableOpacity>
              {item.website && (
                <TouchableOpacity 
                  style={styles.quickAction}
                  onPress={() => handleWebsite(item.website!)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF620' }]}>
                    <Ionicons name="globe" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.quickActionText}>Website</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => handleCreateInvoice(item)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="receipt" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.quickActionText}>Invoice</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{formatCurrency(item.total_revenue)}</Text>
                <Text style={styles.statBoxLabel}>Total Revenue</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{item.completed_projects}</Text>
                <Text style={styles.statBoxLabel}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{item.active_projects}</Text>
                <Text style={styles.statBoxLabel}>Active</Text>
              </View>
            </View>

            {item.contacts.length > 0 && (
              <View style={styles.contactsSection}>
                <Text style={styles.sectionTitle}>Contacts</Text>
                {item.contacts.map((contact) => (
                  <View key={contact.id} style={styles.contactRow}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactRole}>{contact.role}</Text>
                    </View>
                    <View style={styles.contactActions}>
                      {contact.phone && (
                        <TouchableOpacity onPress={() => handleCall(contact.phone!)}>
                          <Ionicons name="call" size={20} color="#10B981" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => handleEmail(contact.email)}>
                        <Ionicons name="mail" size={20} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {item.address && (
              <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>Address</Text>
                <Text style={styles.addressText}>
                  {item.address.street}{'\n'}
                  {item.address.city}, {item.address.state} {item.address.zip}
                </Text>
              </View>
            )}

            {item.tags.length > 0 && (
              <View style={styles.tagsSection}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {item.relationship_start && (
              <Text style={styles.relationshipStart}>
                Client since {formatDate(item.relationship_start)}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Clients</Text>
          <TouchableOpacity>
            <Ionicons name="person-add-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total_clients}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active_clients}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.total_revenue)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchText}
            placeholder="Search clients..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              setLoading(true);
              fetchClients();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'inactive', 'prospect'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => {
                setFilterStatus(status);
                setLoading(true);
              }}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All Clients' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={clients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Clients Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try a different search' : 'Your clients will appear here'}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  searchText: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#FFF',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  filterChipActive: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  clientIndustry: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clientRevenue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  clientMetaDot: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 6,
  },
  clientProjects: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  primaryContact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  primaryContactName: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  primaryContactRole: {
    fontSize: 12,
    color: '#666',
  },
  clientExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11,
    color: '#a0a0a0',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  contactsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  contactRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 16,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#1473FF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1473FF',
    fontWeight: '500',
  },
  relationshipStart: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
