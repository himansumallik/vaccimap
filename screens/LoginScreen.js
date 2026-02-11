import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
// This is the key component you found - the modal verifier
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithCredential, PhoneAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
// Import our central firebase config
import { auth, db, appId, firebaseConfig } from '../firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// We pass in { navigation } from React Navigation
export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const recaptchaVerifier = useRef(null);

  // Step 1: Send OTP
  const sendVerification = async () => {
    try {
      if (!phoneNumber.startsWith('+')) {
        Alert.alert('Error', 'Please enter a valid phone number in E.164 format (e.g., +1234567890).');
        return;
      }

      const phoneProvider = new PhoneAuthProvider(auth); // Use auth from firebase.js
      const id = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier.current);
      setVerificationId(id);
      Alert.alert('Success', 'OTP has been sent to your phone.');
    } catch (error) {
      console.error('Phone auth error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Step 2: Verify OTP and Navigate
  const confirmCode = async () => {
    try {
      if (!verificationId || !otp) {
        Alert.alert('Error', 'Please enter the OTP.');
        return;
      }

      const credential = PhoneAuthProvider.credential(verificationId, otp);
      // Sign in the user
      const userCredential = await signInWithCredential(auth, credential);
      
      // --- NAVIGATION LOGIC ADDED ---
      const user = userCredential.user;
      if (!user) {
        throw new Error("User not found after sign in!");
      }
      
      Alert.alert('Success', 'Phone authentication successful! Checking profile...');

      // Check Firestore for profile
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // Profile EXISTS: Go to Dashboard
        navigation.replace('Dashboard');
      } else {
        // Profile DOES NOT EXIST: Go to CreateProfile
        navigation.replace('CreateProfile');
      }
      // --- END NAVIGATION LOGIC ---

    } catch (error) {
      console.error('OTP confirm error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Helper to reset state if user wants to change number
  const changeNumber = () => {
    setVerificationId(null);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* reCAPTCHA Modal */}
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig} // Use config from firebase.js
        />

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check" size={60} color="#fff" />
          </View>
          <Text style={styles.appName}>VacciMap</Text>
          <Text style={styles.tagline}>Secure Vaccination Tracking</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {!verificationId ? (
            <>
              <Text style={styles.stepTitle}>Welcome Back</Text>
              <Text style={styles.stepSubtitle}>Enter your mobile number to continue</Text>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="phone" size={24} color="#0284c7" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  autoComplete="tel"
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={sendVerification}>
                <Text style={styles.buttonText}>Send OTP</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.stepTitle}>Verify OTP</Text>
              <Text style={styles.stepSubtitle}>Enter the code sent to {phoneNumber}</Text>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#0284c7" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={confirmCode}>
                <Text style={styles.buttonText}>Verify & Login</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={changeNumber} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Change Phone Number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- STYLES (from your working code) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0284c7', // Brand Blue Background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#e0f2fe',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#334155',
  },
  button: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  textButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  textButtonLabel: {
    color: '#64748b',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
