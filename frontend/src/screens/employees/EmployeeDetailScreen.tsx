/**
 * EMPLOYEE DETAIL SCREEN
 * View and edit individual employee information
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date: string;
  salary: number;
  pay_type: 'salary' | 'hourly';
  hourly_rate?: number;
  avatar_url?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  direct_deposit: {
    bank_name: string;
    account_type: string;
    routing_last4: string;
    account_last4: string;
  };
  tax_info: {
    filing_status: string;
    allowances: number;
    additional_withholding: number;
  };
}

export default function EmployeeDetailScreen({ route, navigation }: any) {
  const { employeeId } = route?.params || { employeeId: 1 };
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'documents'>('overview');

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    // Mock data - replace with API call
    setTimeout(() => {
      setEmployee({
        id: employeeId,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@company.com',
        phone: '(555) 123-4567',
        department: 'Engineering',
        position: 'Senior Developer',
        status: 'active',
        hire_date: '2022-03-15',
        salary: 95000,
        pay_type: 'salary',
        address: {
          street: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
        emergency_contact: {
          name: 'John Johnson',
          relationship: 'Spouse',
          phone: '(555) 987-6543',
        },
        direct_deposit: {
          bank_name: 'Chase Bank',
          account_type: 'Checking',
          routing_last4: '1234',
          account_last4: '5678',
        },
        tax_info: {
          filing_status: 'Married Filing Jointly',
          allowances: 2,
          additional_withholding: 0,
        },
      });
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployee();
  };

  const handleEdit = () => {
    navigation.navigate('EditEmployee', { employeeId });
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Employee',
      'Are you sure you want to deactivate this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'on_leave': return '#F59E0B';
      default: return '#666';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1473FF" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Employee not found</Text>
      </View>
    );
  }

  const renderInfoRow = (icon: string, label: string, value: string) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={20} color="#666" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="create-outline" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {employee.avatar_url ? (
              <Image source={{ uri: employee.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {employee.first_name[0]}{employee.last_name[0]}
                </Text>
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(employee.status) }]} />
          </View>
          <Text style={styles.employeeName}>{employee.first_name} {employee.last_name}</Text>
          <Text style={styles.employeePosition}>{employee.position}</Text>
          <Text style={styles.employeeDepartment}>{employee.department}</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {(['overview', 'payroll', 'documents'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && (
          <>
            {renderSection('Contact Information', (
              <>
                {renderInfoRow('mail-outline', 'Email', employee.email)}
                {renderInfoRow('call-outline', 'Phone', employee.phone)}
                {renderInfoRow('location-outline', 'Address',
                  `${employee.address.street}\n${employee.address.city}, ${employee.address.state} ${employee.address.zip}`
                )}
              </>
            ))}

            {renderSection('Employment Details', (
              <>
                {renderInfoRow('calendar-outline', 'Hire Date', formatDate(employee.hire_date))}
                {renderInfoRow('briefcase-outline', 'Department', employee.department)}
                {renderInfoRow('person-outline', 'Position', employee.position)}
                {renderInfoRow('checkmark-circle-outline', 'Status',
                  employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('_', ' ')
                )}
              </>
            ))}

            {renderSection('Emergency Contact', (
              <>
                {renderInfoRow('person-outline', 'Name', employee.emergency_contact.name)}
                {renderInfoRow('people-outline', 'Relationship', employee.emergency_contact.relationship)}
                {renderInfoRow('call-outline', 'Phone', employee.emergency_contact.phone)}
              </>
            ))}
          </>
        )}

        {activeTab === 'payroll' && (
          <>
            {renderSection('Compensation', (
              <>
                {renderInfoRow('cash-outline', 'Pay Type',
                  employee.pay_type === 'salary' ? 'Salary' : 'Hourly'
                )}
                {renderInfoRow('wallet-outline',
                  employee.pay_type === 'salary' ? 'Annual Salary' : 'Hourly Rate',
                  employee.pay_type === 'salary'
                    ? formatCurrency(employee.salary)
                    : `${formatCurrency(employee.hourly_rate || 0)}/hr`
                )}
              </>
            ))}

            {renderSection('Direct Deposit', (
              <>
                {renderInfoRow('business-outline', 'Bank', employee.direct_deposit.bank_name)}
                {renderInfoRow('card-outline', 'Account Type', employee.direct_deposit.account_type)}
                {renderInfoRow('key-outline', 'Routing', `****${employee.direct_deposit.routing_last4}`)}
                {renderInfoRow('lock-closed-outline', 'Account', `****${employee.direct_deposit.account_last4}`)}
              </>
            ))}

            {renderSection('Tax Information', (
              <>
                {renderInfoRow('document-text-outline', 'Filing Status', employee.tax_info.filing_status)}
                {renderInfoRow('people-outline', 'Allowances', employee.tax_info.allowances.toString())}
                {renderInfoRow('add-circle-outline', 'Additional Withholding',
                  formatCurrency(employee.tax_info.additional_withholding)
                )}
              </>
            ))}
          </>
        )}

        {activeTab === 'documents' && (
          <View style={styles.documentsContainer}>
            {['W-4 Form', 'I-9 Form', 'Direct Deposit Form', 'Offer Letter'].map((doc, index) => (
              <TouchableOpacity key={index} style={styles.documentRow}>
                <View style={styles.documentIcon}>
                  <Ionicons name="document-text-outline" size={24} color="#1473FF" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc}</Text>
                  <Text style={styles.documentDate}>Uploaded Jan 15, 2024</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Paystubs', { employeeId })}>
            <Ionicons name="receipt-outline" size={20} color="#1473FF" />
            <Text style={styles.actionButtonText}>View Paystubs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Timesheet', { employeeId })}>
            <Ionicons name="time-outline" size={20} color="#1473FF" />
            <Text style={styles.actionButtonText}>View Timesheets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDeactivate}>
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Deactivate Employee</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  editButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  employeePosition: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  employeeDepartment: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1473FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#1473FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
  },
  documentsContainer: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingVertical: 8,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  documentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionsContainer: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 15,
    color: '#1473FF',
    marginLeft: 12,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#EF4444',
  },
  bottomPadding: {
    height: 40,
  },
});
