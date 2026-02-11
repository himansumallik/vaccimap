import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase'; // Import auth, db, and appId
import { Button, HelperText, TextInput, Title } from 'react-native-paper'; // Use react-native-paper

export default function CreateProfileScreen({ navigation }) {
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation function from your example
  const validate = () => {
    if (!parentName || !childName || !childDOB || !address) {
      setError('Please fill in all fields.');
      return false;
    }
    // Simple YYYY-MM-DD validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(childDOB)) {
        setError('Please enter DOB in YYYY-MM-DD format.');
        return false;
    }
    setError('');
    return true;
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user is logged in!");
      }

      // 1. Get the user's phone number from their auth profile
      const userPhoneNumber = user.phoneNumber;

      // 2. Define the document reference for their profile
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');

      // 3. Set the data
      await setDoc(userDocRef, {
        userId: user.uid,
        phone: userPhoneNumber, // Save the phone number from auth
        parentName: parentName,
        childName: childName,
        childDOB: childDOB,
        address: address,
        createdAt: new Date().toISOString(), // Good to have a timestamp
      });

      setLoading(false);
      Alert.alert('Profile Saved!', 'Your profile has been created successfully.');
      navigation.replace('Dashboard'); // Navigate to the main app

    } catch (err) {
      setLoading(false);
      setError(`Error: ${err.message}`);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error("Save profile error:", err);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{flex: 1, backgroundColor: '#f5f6fa'}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Title style={{marginBottom: 20, textAlign: 'center', color: '#2f3640'}}>
          Complete Your Profile
        </Title>
        <TextInput 
          label="Parent Name" 
          value={parentName} 
          onChangeText={setParentName} 
          style={styles.input}
          mode="outlined"
        />
        <TextInput 
          label="Child Name" 
          value={childName} 
          onChangeText={setChildName} 
          style={styles.input} 
          mode="outlined"
        />
        <TextInput 
          label="Child DOB (YYYY-MM-DD)" 
          value={childDOB} 
          onChangeText={setChildDOB} 
          style={styles.input} 
          mode="outlined"
          keyboardType="numeric"
        />
        <TextInput 
          label="Address" 
          value={address} 
          onChangeText={setAddress} 
          multiline
          style={styles.input} 
          mode="outlined"
        />
        
        {error ? <HelperText type="error" style={{marginBottom: 10}}>{error}</HelperText> : null}
        
        <Button 
          mode="contained" 
          onPress={handleSaveProfile} 
          style={styles.button} 
          loading={loading} 
          disabled={loading}
          labelStyle={{color: '#fff', fontSize: 16, fontWeight: '600'}}
        >
          Save Profile & Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Adapted styles from your example, using react-native-paper
const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    alignItems: 'stretch', 
    flexGrow: 1, 
    justifyContent: 'center',
    backgroundColor: '#f5f6fa',
  },
  input: { 
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: { 
    marginVertical: 8,
    paddingVertical: 8,
    backgroundColor: '#273c75',
  },
});

