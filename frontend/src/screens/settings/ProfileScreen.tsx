/**
 * SAURELLIUS PROFILE
 * Edit user profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Smith');
  const [email, setEmail] = useState('john.smith@company.com');
  const [phone, setPhone] = useState('(555) 123-4567');
  const [department, setDepartment] = useState('Engineering');
  const [position, setPosition] = useState('Senior Developer');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);
  };

  const renderField = (label: string, value: string, setter: (v: string) => void, editable: boolean = true) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={setter}
          placeholder={label}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
          <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JS</Text>
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton}>
              <Ionicons name="camera" size={16} color="#1473FF" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderField('First Name', firstName, setFirstName)}
          {renderField('Last Name', lastName, setLastName)}
          {renderField('Email', email, setEmail)}
          {renderField('Phone', phone, setPhone)}
        </View>

        {/* Work Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Information</Text>
          {renderField('Department', department, setDepartment, false)}
          {renderField('Position', position, setPosition, false)}
          {renderField('Employee ID', 'EMP-001234', () => {}, false)}
          {renderField('Hire Date', 'March 15, 2022', () => {}, false)}
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          {renderField('Name', 'Jane Smith', () => {})}
          {renderField('Relationship', 'Spouse', () => {})}
          {renderField('Phone', '(555) 987-6543', () => {})}
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  editButton: { fontSize: 16, fontWeight: '600', color: '#fff' },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#1473FF' },
  changePhotoButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  changePhotoText: { fontSize: 14, color: '#1473FF', marginLeft: 6 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 16 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#333' },
  fieldInput: { fontSize: 16, color: '#333', borderBottomWidth: 1, borderBottomColor: '#1473FF', paddingVertical: 4 },
  cancelButton: { marginHorizontal: 16, marginBottom: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#666' },
});

export default ProfileScreen;
