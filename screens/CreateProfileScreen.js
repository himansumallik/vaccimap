import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { Button, HelperText, TextInput, Title, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.mainContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Title style={styles.headerTitle}>Complete Your Profile</Title>
        
        {/* Parent & Child Names */}
        <TextInput label="Parent Name" value={parentName} onChangeText={setParentName} style={styles.input} mode="outlined" />
        <TextInput label="Child Name" value={childName} onChangeText={setChildName} style={styles.input} mode="outlined" />

        {/* Date of Birth Picker */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput 
              label="Child Date of Birth" 
              value={childDOB} 
              placeholder="Select Date"
              style={styles.input} 
              mode="outlined"
              right={<TextInput.Icon icon="calendar" />}
            />
          </View>
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

        {error ? <HelperText type="error" style={styles.errorText}>{error}</HelperText> : null}
        
        <Button 
          mode="contained" 
          onPress={handleSaveProfile} 
          style={styles.saveButton} 
          loading={loading} 
          disabled={loading}
        >
          Save Profile & Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f6fa' },
  scrollContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  headerTitle: { marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  subTitle: { marginTop: 15, fontSize: 18 },
  infoText: { fontSize: 12, color: '#666', marginBottom: 10 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  locationButton: { marginBottom: 10, borderColor: '#273c75' },
  mapContainer: { height: 180, marginVertical: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  miniMap: { width: '100%', height: '100%' },
  coordsText: { textAlign: 'center', fontSize: 10, color: '#777', marginTop: 4 },
  errorText: { marginBottom: 10, textAlign: 'center' },
  saveButton: { marginTop: 20, paddingVertical: 8, backgroundColor: '#273c75' },
});