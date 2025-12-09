/**
 * SAURELLIUS EMPLOYEES
 * Employee directory with search, filters, and management
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
  salary: number;
}

// Sample data
const SAMPLE_EMPLOYEES: Employee[] = [
  { id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@company.com', phone: '(555) 123-4567', department: 'Engineering', position: 'Senior Developer', hire_date: '2022-03-15', status: 'active', salary: 95000 },
  { id: 2, first_name: 'Michael', last_name: 'Chen', email: 'michael.c@company.com', phone: '(555) 234-5678', department: 'Design', position: 'UI/UX Designer', hire_date: '2021-08-01', status: 'active', salary: 78000 },
  { id: 3, first_name: 'Emily', last_name: 'Davis', email: 'emily.d@company.com', phone: '(555) 345-6789', department: 'Marketing', position: 'Marketing Manager', hire_date: '2020-11-20', status: 'active', salary: 85000 },
  { id: 4, first_name: 'James', last_name: 'Wilson', email: 'james.w@company.com', phone: '(555) 456-7890', department: 'Sales', position: 'Account Executive', hire_date: '2023-01-10', status: 'active', salary: 72000 },
  { id: 5, first_name: 'Maria', last_name: 'Garcia', email: 'maria.g@company.com', phone: '(555) 567-8901', department: 'HR', position: 'HR Specialist', hire_date: '2022-06-15', status: 'on_leave', salary: 65000 },
  { id: 6, first_name: 'David', last_name: 'Brown', email: 'david.b@company.com', phone: '(555) 678-9012', department: 'Finance', position: 'Financial Analyst', hire_date: '2021-04-01', status: 'active', salary: 82000 },
  { id: 7, first_name: 'Lisa', last_name: 'Anderson', email: 'lisa.a@company.com', phone: '(555) 789-0123', department: 'Engineering', position: 'QA Engineer', hire_date: '2022-09-01', status: 'active', salary: 75000 },
  { id: 8, first_name: 'Robert', last_name: 'Taylor', email: 'robert.t@company.com', phone: '(555) 890-1234', department: 'Operations', position: 'Operations Lead', hire_date: '2020-02-15', status: 'inactive', salary: 88000 },
];

const EmployeesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const departments = [...new Set(employees.map(e => e.department))];

  useEffect(() => {
    let filtered = employees;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e => 
          e.first_name.toLowerCase().includes(query) ||
          e.last_name.toLowerCase().includes(query) ||
          e.email.toLowerCase().includes(query) ||
          e.position.toLowerCase().includes(query)
      );
    }
    
    if (selectedDepartment) {
      filtered = filtered.filter(e => e.department === selectedDepartment);
    }
    
    setFilteredEmployees(filtered);
  }, [searchQuery, selectedDepartment, employees]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'on_leave': return '#F59E0B';
      case 'inactive': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id })}
    >
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(item.first_name, item.last_name)}</Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
      </View>
      
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.employeePosition}>{item.position}</Text>
        <Text style={styles.employeeDepartment}>{item.department}</Text>
      </View>
      
      <View style={styles.employeeActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="mail-outline" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={20} color="#666" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Employees</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEmployee')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{employees.length} total employees</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Department Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...departments]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                (item === 'All' ? !selectedDepartment : selectedDepartment === item) && styles.filterChipActive
              ]}
              onPress={() => setSelectedDepartment(item === 'All' ? null : item)}
            >
              <Text style={[
                styles.filterChipText,
                (item === 'All' ? !selectedDepartment : selectedDepartment === item) && styles.filterChipTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Employee List */}
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEmployee}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No employees found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1473FF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1473FF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default EmployeesScreen;
