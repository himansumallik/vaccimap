import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, Text as RNText } from 'react-native';
import { Button, Card, Text, Title } from 'react-native-paper';
import VaccineCard from '../components/VaccineCard';
import mockData from '../data/mockData.json';
import { auth, db, appId } from '../firebase';

// --- NEW IMPORTS ---
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
// --- END NEW IMPORTS ---

// Mock data for the nearest center
const MOCK_CENTER = {
  latitude: 12.8245, // Example: A location in Chennai
  longitude: 80.0450,
  title: "VacciMap Polio Center (Mock)",
  description: "Nearest vaccination center"
};

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [data] = useState(mockData);
  const [loading, setLoading] = useState(true);

  // --- NEW LOCATION STATE ---
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  // --- END NEW LOCATION STATE ---

  useEffect(() => {
    // --- NEW FUNCTION TO GET LOCATION ---
    const requestLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);
      } catch (error) {
        console.error("Location error:", error);
        setLocationError('Could not fetch location. Please ensure GPS is on.');
      }
    };
    // --- END NEW FUNCTION ---

    const fetchUserData = async () => {
      // We wrap both async calls
      try {
        await requestLocation(); // Ask for location
        
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'data');
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUser(docSnap.data());
          } else {
            console.error("No profile data found!");
            navigation.replace('Login');
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, []);

  const onLogout = () => {
    auth.signOut()
      .then(() => {
        navigation.replace('Login');
      })
      .catch((err) => {
        console.error(err);
        Alert.alert("Logout Error", err.message);
      });
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
        <RNText style={{marginTop: 10}}>Loading Dashboard...</RNText>
      </View>
    );
  }

  // --- FUNCTION TO RENDER THE MAP ---
  const renderMap = () => {
    if (locationError) {
      return <Text style={{textAlign: 'center', padding: 10, color: 'red'}}>{locationError}</Text>;
    }

    if (!location) {
      return (
        <View style={{alignItems: 'center', padding: 20}}>
          <ActivityIndicator />
          <Text style={{marginTop: 5}}>Getting your location...</Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
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
    );
  };
  // --- END FUNCTION TO RENDER THE MAP ---

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Title>Dashboard</Title>
          <Button mode="outlined" onPress={onLogout}>Logout</Button>
        </View>

        {user && (
          <Card style={styles.card}>
            <Card.Content>
              <Text>Parent: {user.parentName}</Text>
              <Text>Child: {user.childName}</Text>
              <Text>DOB: {user.childDOB}</Text>
              <Text>Mobile: {user.phone}</Text> 
            </Card.Content>
          </Card>
        )}

        <Title style={{marginTop:12}}>Vaccination Status</Title>
        <Card style={styles.card}>
          <Card.Content>
            {Object.entries(data.vaccinationStatus).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={{flex:1, textTransform:'uppercase'}}>{k}</Text>
                <Text>{v ? 'Done' : 'Pending'}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Title style={{marginTop:12}}>Upcoming Vaccines</Title>
        {data.upcoming.map((u) => (
          <VaccineCard key={u.vaccine} vaccine={u.vaccine} date={u.date} />
        ))}

        <Title style={{marginTop:12}}>Nearest Vaccine Center</Title>
        {/* --- THIS IS THE NEW MAP PLACEHOLDER --- */}
        <Card style={[styles.card, { overflow: 'hidden' }]}>
          {renderMap()}
        </Card>
        {/* --- END MAP PLACEHOLDER --- */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { marginVertical: 8, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical:6 },
  // --- NEW STYLE FOR MAP ---
  map: {
    width: '100%',
    height: 250,
  }
});

