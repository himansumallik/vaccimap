import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
// This is the key component you found - the modal verifier
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithCredential, PhoneAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
// Import our central firebase config
import { auth, db, appId, firebaseConfig } from '../firebase';

// We pass in { navigation } from React Navigation
export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const recaptchaVerifier = React.useRef(null);

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
      await signInWithCredential(auth, credential);
      
      // --- NAVIGATION LOGIC ADDED ---
      const user = auth.currentUser;
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

  return (
    <View style={styles.container}>
      {/* reCAPTCHA Modal */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig} // Use config from firebase.js
      />

      <Text style={styles.title}>VacciMap Login</Text>

      {!verificationId ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TouchableOpacity style={styles.button} onPress={sendVerification}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={confirmCode}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// --- STYLES (from your working code) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#2f3640',
  },
  input: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '90%',
    backgroundColor: '#273c75',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

