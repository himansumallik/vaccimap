import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { Button, HelperText, TextInput, Title } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function CreateProfileScreen({ navigation }) {
  // Form State
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Date of Birth State
  const [date, setDate] = useState(new Date());
  const [childDOB, setChildDOB] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Location State
  const [location, setLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // 1. Handle Date Selection
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setChildDOB(formattedDate);
    }
  };

  // 2. Handle GPS Capture
  const getCurrentLocation = async () => {
    setFetchingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Location access is required for GeoAI tracking.");
      setFetchingLocation(false);
      return;
    }

    try {
      let currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentPos.coords);
    } catch (err) {
      Alert.alert("Error", "Could not fetch location. Ensure GPS is on.");
    } finally {
      setFetchingLocation(false);
    }
  };

  // 3. Validation
  const validate = () => {
    if (!parentName || !childName || !childDOB || !location) {
      setError('Please fill all fields and capture your home location.');
      return false;
    }
    setError('');
    return true;
  };

  // 4. Save to Firestore
  const handleSaveProfile = async () => {
    setLoading(true);
    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user is logged in!");

      // Using the deep path required by your VacciMap structure
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');

      await setDoc(userDocRef, {
        userId: user.uid,
        phone: user.phoneNumber,
        parentName: parentName,
        childName: childName,
        childDOB: childDOB, // Saved as YYYY-MM-DD
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        createdAt: new Date().toISOString(),
      });

      setLoading(false);
      Alert.alert('Profile Saved!', 'VacciMap is ready for use.');
      navigation.replace('Dashboard');
    } catch (err) {
      setLoading(false);
      setError(`Error: ${err.message}`);
      Alert.alert('Error', 'Failed to save profile. Check your internet.');
      console.error("Save profile error:", err);
    }
  };

  // 5. Handle Back to Login (Logout)
  const handleBackToLogin = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.mainContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-circle" size={60} color="#fff" />
          </View>
          <Title style={styles.headerTitle}>Complete Your Profile</Title>
          <Text style={styles.tagline}>Tell us about your family</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Parent & Child Names */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-outline" size={24} color="#0284c7" style={styles.inputIcon} />
            <TextInput
              label="Parent Name"
              value={parentName}
              onChangeText={setParentName}
              style={styles.input}
              mode="outlined"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="baby" size={24} color="#0284c7" style={styles.inputIcon} />
            <TextInput
              label="Child Name"
              value={childName}
              onChangeText={setChildName}
              style={styles.input}
              mode="outlined"
              placeholderTextColor="#94a3b8"
            />
          </View>

        {/* Date of Birth Picker */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Child Date of Birth"
              value={childDOB}
              placeholder="Select Date"
              style={styles.input}
              mode="outlined"
              placeholderTextColor="#94a3b8"
              right={<TextInput.Icon icon="calendar" />}
            />
          </View>
        </TouchableOpacity>

         {/* Geo-Location Capture */}
          <Title style={styles.subTitle}>Home Location</Title>
          <Text style={styles.infoText}>This location will be used to find your nearest vaccination center.</Text>

          <Button
            icon="crosshairs-gps"
            mode="outlined"
            onPress={getCurrentLocation}
            loading={fetchingLocation}
            style={styles.locationButton}
          >
            {location ? "Location Captured" : "Capture Current Location"}
          </Button>

          {location && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.miniMap}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
            >
              <Marker coordinate={location} />
            </MapView>
            <Text style={styles.coordsText}>
              Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
            </Text>
            </View>
          )}
        </View>

        {error ? <HelperText type="error" style={styles.errorText}>{error}</HelperText> : null}

        <TouchableOpacity
          onPress={handleSaveProfile} 
          style={styles.saveButton} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveButtonText}>Save Profile & Continue</Text>
          )}
        </TouchableOpacity>

         {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0284c7' },

  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#e0f2fe',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  subTitle: { marginTop: 15, fontSize: 18, color: '#334155' },
  infoText: { fontSize: 14, color: '#71717a', marginBottom: 10 },
  inputContainer: { marginBottom: 15 },
  input: { backgroundColor: '#f8fafc' },
  locationButton: { marginBottom: 15, borderColor: '#0284c7' },
  mapContainer: { height: 180, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e0', marginBottom: 15, },

  miniMap: { width: '100%', height: '100%' },
  coordsText: { textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 5 },
  errorText: { marginBottom: 15, textAlign: 'center', color: '#dc2626' },
  saveButton: { 
    marginTop: 10, 
    paddingVertical: 15, 
    backgroundColor: '#0284c7', 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
});