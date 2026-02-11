import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, Text as RNText } from 'react-native';
import { Button, Card, Text, Title } from 'react-native-paper';
import VaccineCard from '../components/VaccineCard';
import mockData from '../data/mockData.json';
import { auth, db, appId } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- GEOSPATIAL IMPORTS ---
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

// Mock data for the nearest center (Target for GeoAI Optimization)
const MOCK_CENTER = {
  latitude: 12.8245, 
  longitude: 80.0450,
  title: "VacciMap Polio Center (Mock)",
  description: "Nearest vaccination center"
};

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [data] = useState(mockData);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // For DB update feedback

  // Location State
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // 1. Function to get current GPS location
    const requestLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation.coords);
      } catch (error) {
        console.error("Location error:", error);
        setLocationError('Could not fetch location. Please ensure GPS is on.');
      }
    };

    // 2. Function to fetch user profile from deep Firestore path
    const fetchUserData = async () => {
      try {
        await requestLocation(); 
        
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Accessing the specific VacciMap artifact path
          const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'data');
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setUser(docSnap.data());
          } else {
            console.error("No profile data found!");
            navigation.replace('CreateProfile'); // Force registration if data missing
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, []);

  // 3. Function to update Home Location in Database
  const updateHomeLocation = async () => {
    if (!location) {
      Alert.alert("Error", "Current location not found. Please wait for GPS.");
      return;
    }

    setUpdating(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'data');
        
        // Update only the location coordinates
        await updateDoc(userDocRef, {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          lastUpdated: new Date().toISOString()
        });

        Alert.alert("Success", "Your home location has been updated in the database.");
      }
    } catch (error) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Failed to update location.");
    } finally {
      setUpdating(false);
    }
  };

  const onLogout = () => {
    auth.signOut()
      .catch((err) => {
        console.error(err);
        Alert.alert("Logout Error", err.message);
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#273c75" />
        <RNText style={{marginTop: 10}}>Loading VacciMap Data...</RNText>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#f5f6fa'}}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <Title style={styles.boldTitle}>VacciMap Dashboard</Title>
          <Button mode="outlined" onPress={onLogout} color="#c0392b">Logout</Button>
        </View>

        {/* User Profile Card */}
        {user && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.label}>Parent: <Text style={styles.value}>{user.parentName}</Text></Text>
              <Text style={styles.label}>Child: <Text style={styles.value}>{user.childName}</Text></Text>
              <Text style={styles.label}>DOB: <Text style={styles.value}>{user.childDOB}</Text></Text>
              <Text style={styles.label}>Phone: <Text style={styles.value}>{user.phone}</Text></Text> 
            </Card.Content>
          </Card>
        )}

        {/* Map & Update Location Section */}
        <Title style={styles.sectionTitle}>Nearest Vaccine Center</Title>
        <Card style={[styles.card, { overflow: 'hidden' }]}>
          {locationError ? (
            <Text style={styles.errorText}>{locationError}</Text>
          ) : !location ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator />
              <Text style={{marginTop: 5}}>Acquiring GPS...</Text>
            </View>
          ) : (
            <View>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
              >
                <Marker
                  coordinate={MOCK_CENTER}
                  title={MOCK_CENTER.title}
                  description={MOCK_CENTER.description}
                  pinColor="blue"
                />
              </MapView>
              <Button 
                mode="contained" 
                icon="map-marker-radius"
                onPress={updateHomeLocation}
                loading={updating}
                style={styles.updateButton}
              >
                Update Home to Current GPS
              </Button>
            </View>
          )}
        </Card>

        {/* Vaccination Status List */}
        <Title style={styles.sectionTitle}>Immunization Status</Title>
        <Card style={styles.card}>
          <Card.Content>
            {Object.entries(data.vaccinationStatus).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={styles.vaccineName}>{k}</Text>
                <Text style={v ? styles.done : styles.pending}>{v ? 'Completed' : 'Pending'}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Upcoming Vaccines */}
        <Title style={styles.sectionTitle}>Upcoming Schedule</Title>
        {data.upcoming.map((u) => (
          <VaccineCard key={u.vaccine} vaccine={u.vaccine} date={u.date} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  boldTitle: { fontWeight: 'bold', color: '#273c75' },
  sectionTitle: { marginTop: 16, fontSize: 18, fontWeight: '600' },
  card: { marginVertical: 8, backgroundColor: '#fff', elevation: 2 },
  label: { fontSize: 14, color: '#7f8c8d', marginBottom: 2 },
  value: { color: '#2c3e50', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  vaccineName: { textTransform: 'uppercase', fontWeight: '500', flex: 1 },
  done: { color: '#27ae60', fontWeight: 'bold' },
  pending: { color: '#e67e22', fontWeight: 'bold' },
  map: { width: '100%', height: 220 },
  mapPlaceholder: { alignItems: 'center', padding: 40 },
  updateButton: { margin: 8, backgroundColor: '#273c75' },
  errorText: { textAlign: 'center', padding: 20, color: '#c0392b' }
});